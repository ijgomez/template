package org.myorganization.template.core.service;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

import java.util.ArrayList;
import java.util.Map;
import java.util.Optional;
import java.util.function.Supplier;

import org.myorganization.template.cluster.HeartbeatClusterService;
import org.myorganization.template.core.repository.ClusterBlockRepository;
import org.myorganization.template.core.repository.ClusterNodeRepository;
import org.myorganization.template.domain.criteria.ClusterBlockCriteria;
import org.myorganization.template.domain.dto.AuditLogEntry;
import org.myorganization.template.domain.dto.ClusterBlockDTO;
import org.myorganization.template.domain.dto.ClusterNodeDTO;
import org.myorganization.template.domain.entity.ClusterNode;
import org.myorganization.template.domain.enums.AuditSection;
import org.myorganization.template.domain.enums.NodeStatus;
import org.myorganization.template.domain.enums.OperationType;
import org.myorganization.template.domain.exception.EntityNotFoundException;
import org.myorganization.template.domain.exception.MethodNotAllowedException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.extern.slf4j.Slf4j;

/**
 * Service for cluster node and block management.
 * <p>
 * Nodes are auto-registered by the system on startup and updated via heartbeat.
 * Only the master flag is editable via the API.
 * Blocks are read-only from the API perspective.
 */
@Slf4j
@Service
public class ClusterService implements HeartbeatClusterService {

    private static final long DEAD_NODE_TIMEOUT_MINUTES = 5;
    private static final String CLUSTER_NODE = "ClusterNode";
    private static final String SYSTEM_USER = "SYSTEM";

    private final ClusterNodeRepository clusterNodeRepository;
    private final ClusterBlockService clusterBlockService;
    private final AuditService auditService;
    private final NodeEnvironmentProbe environmentProbe;

    public ClusterService(ClusterNodeRepository clusterNodeRepository,
                          ClusterBlockRepository clusterBlockRepository,
                          AuditService auditService,
                          NodeEnvironmentProbe environmentProbe) {
        this.environmentProbe = environmentProbe;
        this.clusterNodeRepository = clusterNodeRepository;
        this.clusterBlockService = new ClusterBlockService(clusterBlockRepository);
        this.auditService = auditService;
    }

    // =====================================================================
    // Node operations
    // =====================================================================

    /**
     * Lists all cluster nodes.
     *
     * @return list of all cluster nodes as DTOs
     */
    @Transactional(readOnly = true)
    public List<ClusterNodeDTO> findAllNodes() {
        return clusterNodeRepository.findAll().stream()
                .map(this::toNodeSummaryDTO)
                .toList();
    }

    /**
     * Finds a cluster node by its identifier.
     *
     * @param id the node identifier
     * @return the node as a DTO
     * @throws EntityNotFoundException if no node exists with the given id
     */
    @Transactional(readOnly = true)
    public ClusterNodeDTO findNodeById(Long id) {
        ClusterNode node = clusterNodeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(CLUSTER_NODE, id));
        return toNodeDetailDTO(node);
    }

    /**
     * Sets a node as the cluster master, deactivating the previous master.
     * Ensures the single-master invariant: only one node can be master at any time.
     *
     * @param id the node identifier to designate as master
     * @return the updated node as a DTO
     * @throws EntityNotFoundException if no node exists with the given id
     */
    @Transactional
    public ClusterNodeDTO setMaster(Long id) {
        ClusterNode node = clusterNodeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(CLUSTER_NODE, id));

        clusterNodeRepository.deactivateAllMasters();
        node.setMaster(true);

        ClusterNode saved = clusterNodeRepository.save(node);
        return toNodeSummaryDTO(saved);
    }

    /**
     * Auto-registers the current node on startup.
     * If a node with the current hostname exists, updates it; otherwise creates a new one.
     */
    @Override
    @Transactional
    public void registerNode() {
        String hostname = getHostname();
        String ip = getIpAddress();
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);

        clusterNodeRepository.findByHostname(hostname).ifPresentOrElse(
                existingNode -> {
                    existingNode.setStatus(NodeStatus.ACTIVE);
                    existingNode.setIp(ip);
                    existingNode.setUsedMemory(getUsedMemory());
                    existingNode.setFreeMemory(getFreeMemory());
                    existingNode.setTotalMemory(getTotalMemory());
                    existingNode.setStartedAt(now);
                    existingNode.setLastModifiedAt(now);
                    applyExtendedInfo(existingNode);
                    clusterNodeRepository.save(existingNode);
                    log.info("Cluster node re-registered: hostname={}", hostname);
                    auditService.log(new AuditLogEntry(
                            SYSTEM_USER, OperationType.UPDATE, AuditSection.CLUSTER,
                            existingNode.getId().toString(), CLUSTER_NODE,
                            "Node re-registered: hostname=" + hostname + ", ip=" + ip));
                },
                () -> {
                    ClusterNode newNode = new ClusterNode();
                    newNode.setHostname(hostname);
                    newNode.setIp(ip);
                    newNode.setStatus(NodeStatus.ACTIVE);
                    newNode.setMaster(false);
                    newNode.setUsedMemory(getUsedMemory());
                    newNode.setFreeMemory(getFreeMemory());
                    newNode.setTotalMemory(getTotalMemory());
                    newNode.setStartedAt(now);
                    applyExtendedInfo(newNode);
                    ClusterNode saved = clusterNodeRepository.save(newNode);
                    log.info("Cluster node registered: hostname={}", hostname);
                    auditService.log(new AuditLogEntry(
                            SYSTEM_USER, OperationType.CREATE, AuditSection.CLUSTER,
                            saved.getId().toString(), CLUSTER_NODE,
                            "Node registered: hostname=" + hostname + ", ip=" + ip));
                }
        );
    }

    /**
     * Periodic heartbeat: updates the current node's status, memory, and lastModifiedAt.
     */
    @Override
    @Transactional
    public void heartbeat() {
        String hostname = getHostname();

        ClusterNode node = clusterNodeRepository.findByHostname(hostname).orElse(null);
        if (node == null) {
            log.error("FATAL: Own cluster node not found by hostname: {}", hostname);
            return;
        }

        node.setStatus(NodeStatus.ACTIVE);
        node.setUsedMemory(getUsedMemory());
        node.setFreeMemory(getFreeMemory());
        node.setTotalMemory(getTotalMemory());
        applyFileSystem(node);
        node.setLastModifiedAt(OffsetDateTime.now(ZoneOffset.UTC));
        clusterNodeRepository.save(node);
    }

    /**
     * Detects nodes with lastModifiedAt older than 5 minutes and marks them as DEAD.
     *
     * @return list of hostnames of nodes that were marked as DEAD
     */
    @Override
    @Transactional
    public List<String> detectDeadNodes() {
        OffsetDateTime threshold = OffsetDateTime.now(ZoneOffset.UTC)
                .minusMinutes(DEAD_NODE_TIMEOUT_MINUTES);

        List<ClusterNode> deadNodes = clusterNodeRepository
                .findByStatusAndLastModifiedAtBefore(NodeStatus.ACTIVE, threshold);

        List<String> deadHostnames = new ArrayList<>();
        for (ClusterNode node : deadNodes) {
            node.setStatus(NodeStatus.INACTIVE);
            clusterNodeRepository.save(node);
            deadHostnames.add(node.getHostname());
            log.warn("Cluster node marked as DEAD: hostname={}, id={}", node.getHostname(), node.getId());
            auditService.log(new AuditLogEntry(
                    SYSTEM_USER, OperationType.UPDATE, AuditSection.CLUSTER,
                    node.getId().toString(), CLUSTER_NODE,
                    "Node marked as INACTIVE: hostname=" + node.getHostname()));
        }
        return deadHostnames;
    }

    /**
     * Auto-elects a master if no ALIVE node with master=true exists.
     * Elects the node running the check (e.g. when the previous master died), falling back to the first ACTIVE node by id.
     */
    @Override
    @Transactional
    public void electMaster() {
        List<ClusterNode> masters = clusterNodeRepository
                .findByMasterTrueAndStatusOrderByIdAsc(NodeStatus.ACTIVE);
        if (masters.isEmpty()) {
            // Prefer the node running this check; fall back to the lowest-id ACTIVE node.
            clusterNodeRepository.findByHostname(getHostname())
                    .filter(n -> n.getStatus() == NodeStatus.ACTIVE)
                    .or(() -> clusterNodeRepository.findFirstByStatusOrderByIdAsc(NodeStatus.ACTIVE))
                    .ifPresent(candidate -> {
                        clusterNodeRepository.deactivateAllMasters();
                        candidate.setMaster(true);
                        clusterNodeRepository.save(candidate);
                        log.info("Cluster master elected: hostname={}, id={}",
                                candidate.getHostname(), candidate.getId());
                    });
            return;
        }
        // Self-heal: enforce the single-master invariant, keeping the lowest id.
        for (ClusterNode extra : masters.subList(1, masters.size())) {
            extra.setMaster(false);
            clusterNodeRepository.save(extra);
            log.warn("Duplicate cluster master demoted: hostname={}, id={}",
                    extra.getHostname(), extra.getId());
        }
    }

    /**
     * Rejects node creation. Nodes are auto-registered by the system only.
     *
     * @param dto ignored
     * @throws MethodNotAllowedException always
     */
    public ClusterNodeDTO createNode(ClusterNodeDTO dto) {
        throw new MethodNotAllowedException("Cluster node creation is not allowed. Nodes are auto-registered by the system.");
    }

    /**
     * Rejects node deletion. Nodes cannot be removed via the API.
     *
     * @param id ignored
     * @throws MethodNotAllowedException always
     */
    public void deleteNode(Long id) {
        throw new MethodNotAllowedException("Cluster node deletion is not allowed.");
    }

    // =====================================================================
    // Block operations
    // =====================================================================

    /**
     * Finds blocks matching the given criteria with pagination.
     *
     * @param criteria the filter criteria (name)
     * @param pageable the pagination information
     * @return a page of block DTOs
     */
    @Transactional(readOnly = true)
    public Page<ClusterBlockDTO> findBlocksByCriteria(ClusterBlockCriteria criteria, Pageable pageable) {
        return clusterBlockService.findByCriteria(criteria, pageable);
    }

    /**
     * Counts blocks matching the given criteria.
     *
     * @param criteria the filter criteria (name)
     * @return the total count of matching blocks
     */
    @Transactional(readOnly = true)
    public long countBlocksByCriteria(ClusterBlockCriteria criteria) {
        return clusterBlockService.countByCriteria(criteria);
    }

    /**
     * Finds a cluster block by its identifier.
     *
     * @param id the block identifier
     * @return the block as a DTO
     * @throws EntityNotFoundException if no block exists with the given id
     */
    @Transactional(readOnly = true)
    public ClusterBlockDTO findBlockById(Long id) {
        return clusterBlockService.findById(id);
    }

    /**
     * Rejects block creation. Blocks are managed exclusively by the system.
     *
     * @param dto ignored
     * @throws MethodNotAllowedException always
     */
    public ClusterBlockDTO createBlock(ClusterBlockDTO dto) {
        throw new MethodNotAllowedException("Cluster block creation is not allowed. Blocks are managed by the system.");
    }

    /**
     * Rejects block update. Blocks are managed exclusively by the system.
     *
     * @param id  ignored
     * @param dto ignored
     * @throws MethodNotAllowedException always
     */
    public ClusterBlockDTO updateBlock(Long id, ClusterBlockDTO dto) {
        throw new MethodNotAllowedException("Cluster block update is not allowed. Blocks are managed by the system.");
    }

    /**
     * Rejects block deletion. Blocks are managed exclusively by the system.
     *
     * @param id ignored
     * @throws MethodNotAllowedException always
     */
    public void deleteBlock(Long id) {
        throw new MethodNotAllowedException("Cluster block deletion is not allowed. Blocks are managed by the system.");
    }

    // =====================================================================
    // Private helpers
    // =====================================================================

    private ClusterNodeDTO toNodeSummaryDTO(ClusterNode node) {
        return buildDTO(node, null, null);
    }

    private ClusterNodeDTO toNodeDetailDTO(ClusterNode node) {
        return buildDTO(node,
                NodePropertiesJsonCodec.fromJson(node.getJvmProperties()),
                NodePropertiesJsonCodec.fromJson(node.getEnvironmentProperties()));
    }

    private ClusterNodeDTO buildDTO(ClusterNode node, Map<String, String> jvm, Map<String, String> env) {
        boolean detail = jvm != null;
        return new ClusterNodeDTO(
                node.getId(),
                node.getStatus(),
                node.getHostname(),
                node.getIp(),
                node.getMaster(),
                node.getUsedMemory(),
                node.getFreeMemory(),
                node.getTotalMemory(),
                node.getStartedAt(),
                node.getLastModifiedAt(),
                detail ? node.getProcessors() : null,
                detail ? node.getFsTotalSpace() : null,
                detail ? node.getFsFreeSpace() : null,
                detail ? node.getFsUsableSpace() : null,
                detail ? node.getFilesystem() : null,
                jvm,
                env
        );
    }

    /** Applies processors, filesystem and masked properties (registration only). */
    private void applyExtendedInfo(ClusterNode node) {
        int processors = environmentProbe.availableProcessors();
        if (processors >= 1) {
            node.setProcessors(processors);
        } else if (node.getProcessors() == null) {
            throw new IllegalStateException("Invalid processor count: " + processors);
        }
        applyFileSystem(node);
        node.setJvmProperties(storeProperties("JVM_Properties", node.getHostname(),
                environmentProbe::jvmProperties));
        node.setEnvironmentProperties(storeProperties("Environment_Properties", node.getHostname(),
                environmentProbe::environmentVariables));
    }

    private void applyFileSystem(ClusterNode node) {
        try {
            NodeEnvironmentProbe.FileSystemSpace space = environmentProbe.fileSystemSpace();
            node.setFsTotalSpace(space.total());
            node.setFsFreeSpace(space.free());
            node.setFsUsableSpace(space.usable());
            node.setFilesystem(space.filesystem());
        } catch (RuntimeException e) {
            log.warn("Unable to read filesystem space: hostname={}, cause={}", node.getHostname(), e.toString());
            node.setFsTotalSpace(null);
            node.setFsFreeSpace(null);
            node.setFsUsableSpace(null);
            node.setFilesystem(null);
        }
    }

    private String storeProperties(String label, String hostname, Supplier<Map<String, String>> source) {
        Map<String, String> masked;
        try {
            masked = SensitivePropertyMasker.mask(source.get());
        } catch (RuntimeException e) {
            log.error("Unable to mask {} properties: hostname={}", label, hostname);
            return null;
        }
        Optional<String> json;
        try {
            json = NodePropertiesJsonCodec.toJson(masked);
        } catch (RuntimeException e) {
            json = Optional.empty();
        }
        if (json.isEmpty()) {
            log.warn("Unable to store {}: serialization failed or exceeds size limit, hostname={}", label, hostname);
            return null;
        }
        return json.get();
    }

    private String getHostname() {
        try {
            return InetAddress.getLocalHost().getHostName();
        } catch (UnknownHostException e) {
            log.error("Unable to determine hostname", e);
            return "unknown";
        }
    }

    private String getIpAddress() {
        try {
            return InetAddress.getLocalHost().getHostAddress();
        } catch (UnknownHostException e) {
            log.error("Unable to determine IP address", e);
            return "0.0.0.0";
        }
    }

    private Long getUsedMemory() {
        Runtime runtime = Runtime.getRuntime();
        return runtime.totalMemory() - runtime.freeMemory();
    }

    private Long getFreeMemory() {
        return Runtime.getRuntime().freeMemory();
    }

    private Long getTotalMemory() {
        return Runtime.getRuntime().totalMemory();
    }
}
