package org.myorganization.template.core.service;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

import java.util.ArrayList;

import org.myorganization.template.cluster.HeartbeatClusterService;
import org.myorganization.template.core.repository.ClusterBlockRepository;
import org.myorganization.template.core.repository.ClusterNodeRepository;
import org.myorganization.template.domain.criteria.ClusterBlockCriteria;
import org.myorganization.template.domain.dto.ClusterBlockDTO;
import org.myorganization.template.domain.dto.ClusterNodeDTO;
import org.myorganization.template.domain.entity.ClusterBlock;
import org.myorganization.template.domain.entity.ClusterNode;
import org.myorganization.template.domain.enums.NodeStatus;
import org.myorganization.template.domain.exception.EntityNotFoundException;
import org.myorganization.template.domain.exception.MethodNotAllowedException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for cluster node and block management.
 * <p>
 * Nodes are auto-registered by the system on startup and updated via heartbeat.
 * Only the master flag is editable via the API.
 * Blocks are read-only from the API perspective.
 */
@Service
public class ClusterService implements HeartbeatClusterService {

    private static final Logger log = LoggerFactory.getLogger(ClusterService.class);

    private static final long DEAD_NODE_TIMEOUT_MINUTES = 5;

    private final ClusterNodeRepository clusterNodeRepository;
    private final ClusterBlockRepository clusterBlockRepository;

    public ClusterService(ClusterNodeRepository clusterNodeRepository,
                          ClusterBlockRepository clusterBlockRepository) {
        this.clusterNodeRepository = clusterNodeRepository;
        this.clusterBlockRepository = clusterBlockRepository;
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
                .map(this::toNodeDTO)
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
                .orElseThrow(() -> new EntityNotFoundException("ClusterNode", id));
        return toNodeDTO(node);
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
                .orElseThrow(() -> new EntityNotFoundException("ClusterNode", id));

        clusterNodeRepository.deactivateAllMasters();
        node.setMaster(true);

        ClusterNode saved = clusterNodeRepository.save(node);
        return toNodeDTO(saved);
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
                    clusterNodeRepository.save(existingNode);
                    log.info("Cluster node re-registered: hostname={}", hostname);
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
                    clusterNodeRepository.save(newNode);
                    log.info("Cluster node registered: hostname={}", hostname);
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
        }
        return deadHostnames;
    }

    /**
     * Auto-elects a master if no ALIVE node with master=true exists.
     * Elects the first ALIVE node ordered by id.
     */
    @Override
    @Transactional
    public void electMaster() {
        boolean masterExists = clusterNodeRepository
                .findByMasterTrueAndStatus(NodeStatus.ACTIVE)
                .isPresent();

        if (!masterExists) {
            clusterNodeRepository.findFirstByStatusOrderByIdAsc(NodeStatus.ACTIVE)
                    .ifPresent(candidate -> {
                        clusterNodeRepository.deactivateAllMasters();
                        candidate.setMaster(true);
                        clusterNodeRepository.save(candidate);
                        log.info("Cluster master elected: hostname={}, id={}",
                                candidate.getHostname(), candidate.getId());
                    });
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
        Specification<ClusterBlock> spec = buildBlockSpecification(criteria);
        return clusterBlockRepository.findAll(spec, pageable).map(this::toBlockDTO);
    }

    /**
     * Counts blocks matching the given criteria.
     *
     * @param criteria the filter criteria (name)
     * @return the total count of matching blocks
     */
    @Transactional(readOnly = true)
    public long countBlocksByCriteria(ClusterBlockCriteria criteria) {
        Specification<ClusterBlock> spec = buildBlockSpecification(criteria);
        return clusterBlockRepository.count(spec);
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
        ClusterBlock block = clusterBlockRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ClusterBlock", id));
        return toBlockDTO(block);
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

    private Specification<ClusterBlock> buildBlockSpecification(ClusterBlockCriteria criteria) {
        Specification<ClusterBlock> spec = (root, query, cb) -> cb.conjunction();

        if (criteria.name() != null && !criteria.name().isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("name")), "%" + criteria.name().toLowerCase() + "%"));
        }

        return spec;
    }

    private ClusterNodeDTO toNodeDTO(ClusterNode node) {
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
                node.getLastModifiedAt()
        );
    }

    private ClusterBlockDTO toBlockDTO(ClusterBlock block) {
        return new ClusterBlockDTO(
                block.getId(),
                block.getName(),
                block.getStartDate(),
                block.getAvgTime(),
                block.getMinTime(),
                block.getMaxTime(),
                block.getTotal()
        );
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
