package org.myorganization.template.core.service;

import java.util.List;

import org.myorganization.template.core.repository.ClusterJobRepository;
import org.myorganization.template.core.repository.ClusterNodeRepository;
import org.myorganization.template.core.repository.ClusterTaskRepository;
import org.myorganization.template.domain.dto.AuditLogEntry;
import org.myorganization.template.domain.dto.ClusterJobDTO;
import org.myorganization.template.domain.dto.ClusterTaskDTO;
import org.myorganization.template.domain.entity.ClusterJob;
import org.myorganization.template.domain.entity.ClusterJobPK;
import org.myorganization.template.domain.entity.ClusterNode;
import org.myorganization.template.domain.entity.ClusterTask;
import org.myorganization.template.domain.enums.AuditSection;
import org.myorganization.template.domain.enums.OperationType;
import org.myorganization.template.domain.exception.DuplicateEntityException;
import org.myorganization.template.domain.exception.EntityNotFoundException;
import org.myorganization.template.domain.exception.ValidationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for managing the assignment of cluster tasks to cluster nodes (ClusterJob).
 * <p>
 * Nodes themselves are read-only from the API perspective (auto-registered by the
 * system); this service only manages the jobs (task assignments) associated to a node
 * and exposes the task catalog. All write operations are audited manually via
 * {@link AuditService} (no {@code @Auditable}), because the audited entity id is the
 * composite {@code nodeId:taskId}.
 */
@Service
public class ClusterJobService {

    private final ClusterNodeRepository clusterNodeRepository;
    private final ClusterTaskRepository clusterTaskRepository;
    private final ClusterJobRepository clusterJobRepository;
    private final AuditService auditService;

    public ClusterJobService(ClusterNodeRepository clusterNodeRepository,
                             ClusterTaskRepository clusterTaskRepository,
                             ClusterJobRepository clusterJobRepository,
                             AuditService auditService) {
        this.clusterNodeRepository = clusterNodeRepository;
        this.clusterTaskRepository = clusterTaskRepository;
        this.clusterJobRepository = clusterJobRepository;
        this.auditService = auditService;
    }

    /**
     * Lists all jobs assigned to a node, ordered by priority ascending.
     *
     * @param nodeId the node identifier
     * @return the jobs assigned to the node as DTOs, ordered by priority
     * @throws EntityNotFoundException if no node exists with the given id
     */
    @Transactional(readOnly = true)
    public List<ClusterJobDTO> findJobsByNode(Long nodeId) {
        requireNode(nodeId);
        return clusterJobRepository.findByClusterNodeIdOrderByPriorityAsc(nodeId).stream()
                .map(this::toDTO)
                .toList();
    }

    /**
     * Assigns a task to a node, creating a new ClusterJob.
     * <p>
     * The {@code clusterNodeId} of the body is ignored; the node is always taken from
     * the path. The {@code clusterTaskId} is required and the task must exist. If the
     * job already exists a {@link DuplicateEntityException} is raised. Priority, if
     * provided, must be {@code >= 0}; {@code enabled} defaults to {@code true}.
     *
     * @param nodeId the node identifier (from path)
     * @param dto    the job data
     * @return the created job as a DTO
     * @throws EntityNotFoundException  if the node or task does not exist
     * @throws ValidationException      if clusterTaskId is null or priority is negative
     * @throws DuplicateEntityException if the job already exists
     */
    @Transactional
    public ClusterJobDTO assignJob(Long nodeId, ClusterJobDTO dto) {
        ClusterNode node = requireNode(nodeId);

        Long taskId = dto.clusterTaskId();
        if (taskId == null) {
            throw new ValidationException("clusterTaskId is required");
        }
        validatePriority(dto.priority());

        ClusterTask task = clusterTaskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("ClusterTask", taskId));

        if (clusterJobRepository.existsById(new ClusterJobPK(nodeId, taskId))) {
            throw new DuplicateEntityException("ClusterJob", "taskId", taskId);
        }

        ClusterJob job = new ClusterJob();
        job.setId(new ClusterJobPK(nodeId, taskId));
        job.setClusterNode(node);
        job.setClusterTask(task);
        job.setPriority(dto.priority());
        job.setEnabled(dto.enabled() == null ? Boolean.TRUE : dto.enabled());

        ClusterJob saved = clusterJobRepository.save(job);

        audit(OperationType.CREATE, nodeId, taskId,
                "Assigned task " + taskId + " to node " + nodeId
                        + " (priority=" + saved.getPriority() + ", enabled=" + saved.getEnabled() + ")");

        return toDTO(saved);
    }

    /**
     * Updates an existing job (priority and/or enabled flag) for a node.
     * <p>
     * The {@code clusterNodeId} of the body is ignored. The {@code clusterTaskId}, if
     * present, must match the path {@code taskId}. Priority, if provided, must be
     * {@code >= 0}; {@code enabled} is required.
     *
     * @param nodeId the node identifier (from path)
     * @param taskId the task identifier (from path)
     * @param dto    the job data
     * @return the updated job as a DTO
     * @throws EntityNotFoundException if the node or job does not exist
     * @throws ValidationException     if clusterTaskId mismatches, priority is negative or enabled is null
     */
    @Transactional
    public ClusterJobDTO updateJob(Long nodeId, Long taskId, ClusterJobDTO dto) {
        requireNode(nodeId);

        if (dto.clusterTaskId() != null && !dto.clusterTaskId().equals(taskId)) {
            throw new ValidationException("clusterTaskId does not match path task id");
        }
        validatePriority(dto.priority());
        if (dto.enabled() == null) {
            throw new ValidationException("enabled is required");
        }

        ClusterJob job = clusterJobRepository.findById(new ClusterJobPK(nodeId, taskId))
                .orElseThrow(() -> new EntityNotFoundException("ClusterJob", nodeId + ":" + taskId));

        job.setPriority(dto.priority());
        job.setEnabled(dto.enabled());

        ClusterJob saved = clusterJobRepository.save(job);

        audit(OperationType.UPDATE, nodeId, taskId,
                "Updated job " + nodeId + ":" + taskId
                        + " (priority=" + saved.getPriority() + ", enabled=" + saved.getEnabled() + ")");

        return toDTO(saved);
    }

    /**
     * Removes a job (task assignment) from a node.
     *
     * @param nodeId the node identifier (from path)
     * @param taskId the task identifier (from path)
     * @throws EntityNotFoundException if the job does not exist
     */
    @Transactional
    public void deleteJob(Long nodeId, Long taskId) {
        ClusterJobPK pk = new ClusterJobPK(nodeId, taskId);
        ClusterJob job = clusterJobRepository.findById(pk)
                .orElseThrow(() -> new EntityNotFoundException("ClusterJob", nodeId + ":" + taskId));

        clusterJobRepository.delete(job);

        audit(OperationType.DELETE, nodeId, taskId, "Deleted job " + nodeId + ":" + taskId);
    }

    /**
     * Lists all cluster task definitions (catalog).
     *
     * @return all cluster tasks as DTOs
     */
    @Transactional(readOnly = true)
    public List<ClusterTaskDTO> findAllTasks() {
        return clusterTaskRepository.findAll().stream()
                .map(this::toTaskDTO)
                .toList();
    }

    // =====================================================================
    // Private helpers
    // =====================================================================

    private ClusterNode requireNode(Long nodeId) {
        return clusterNodeRepository.findById(nodeId)
                .orElseThrow(() -> new EntityNotFoundException("ClusterNode", nodeId));
    }

    private void validatePriority(Integer priority) {
        if (priority != null && priority < 0) {
            throw new ValidationException("priority must be greater than or equal to 0");
        }
    }

    private void audit(OperationType operationType, Long nodeId, Long taskId, String detail) {
        auditService.log(new AuditLogEntry(
                extractUsername(),
                operationType,
                AuditSection.CLUSTER,
                nodeId + ":" + taskId,
                "ClusterJob",
                detail));
    }

    /**
     * Extracts the username from the Spring Security context, replicating
     * {@code AuditAspect.extractUsername()}.
     *
     * @return the authenticated username, or "SYSTEM" if no authentication is present
     */
    private String extractUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            return authentication.getName();
        }
        return "SYSTEM";
    }

    private ClusterJobDTO toDTO(ClusterJob job) {
        return new ClusterJobDTO(
                job.getId().getClusterNodeId(),
                job.getId().getClusterTaskId(),
                job.getPriority(),
                job.getEnabled()
        );
    }

    private ClusterTaskDTO toTaskDTO(ClusterTask task) {
        return new ClusterTaskDTO(
                task.getId(),
                task.getName(),
                task.getDescription(),
                task.getNodes(),
                task.getMinNodes()
        );
    }
}
