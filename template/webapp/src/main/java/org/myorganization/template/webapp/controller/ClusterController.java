package org.myorganization.template.webapp.controller;

import java.util.List;

import org.myorganization.template.core.service.ClusterJobService;
import org.myorganization.template.core.service.ClusterService;
import org.myorganization.template.domain.criteria.ClusterBlockCriteria;
import org.myorganization.template.domain.dto.ClusterBlockDTO;
import org.myorganization.template.domain.dto.ClusterJobDTO;
import org.myorganization.template.domain.dto.ClusterNodeDTO;
import org.myorganization.template.domain.dto.ClusterTaskDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for cluster administration.
 * <p>
 * Exposes read-only endpoints for cluster nodes and blocks, plus a PATCH endpoint
 * to designate a node as master. Node creation and deletion are not allowed (405).
 * Block management is read-only from the API perspective.
 */
@RestController
@RequestMapping("/api/v1/administration/cluster")
public class ClusterController {

    private final ClusterService clusterService;
    private final ClusterJobService clusterJobService;

    public ClusterController(ClusterService clusterService, ClusterJobService clusterJobService) {
        this.clusterService = clusterService;
        this.clusterJobService = clusterJobService;
    }

    // =====================================================================
    // Node endpoints
    // =====================================================================

    /**
     * Lists all cluster nodes.
     *
     * @return 200 OK with the list of cluster nodes
     */
    @GetMapping("/nodes")
    public ResponseEntity<List<ClusterNodeDTO>> findAllNodes() {
        List<ClusterNodeDTO> nodes = clusterService.findAllNodes();
        return ResponseEntity.ok(nodes);
    }

    /**
     * Retrieves a cluster node by its identifier.
     *
     * @param id the node identifier
     * @return 200 OK with the node, or 404 if not found
     */
    @GetMapping("/nodes/{id}")
    public ResponseEntity<ClusterNodeDTO> findNodeById(@PathVariable Long id) {
        ClusterNodeDTO node = clusterService.findNodeById(id);
        return ResponseEntity.ok(node);
    }

    /**
     * Updates the master flag of a cluster node.
     * <p>
     * Only the {@code master} field can be modified via this endpoint.
     * Setting master to true deactivates the previous master node.
     *
     * @param id      the node identifier
     * @param request the request body containing the master flag
     * @return 200 OK with the updated node
     */
    @PatchMapping("/nodes/{id}")
    public ResponseEntity<ClusterNodeDTO> updateMaster(@PathVariable Long id,
                                                       @RequestBody SetMasterRequest request) {
        ClusterNodeDTO updated = clusterService.setMaster(id);
        return ResponseEntity.ok(updated);
    }

    /**
     * Rejects node creation with 405 Method Not Allowed.
     * Nodes are auto-registered by the system.
     *
     * @param dto ignored
     * @return 405 Method Not Allowed (thrown by service)
     */
    @PostMapping("/nodes")
    public ResponseEntity<ClusterNodeDTO> createNode(@RequestBody ClusterNodeDTO dto) {
        ClusterNodeDTO created = clusterService.createNode(dto);
        return ResponseEntity.ok(created);
    }

    /**
     * Rejects node deletion with 405 Method Not Allowed.
     * Nodes cannot be removed via the API.
     *
     * @param id ignored
     * @return 405 Method Not Allowed (thrown by service)
     */
    @DeleteMapping("/nodes/{id}")
    public ResponseEntity<Void> deleteNode(@PathVariable Long id) {
        clusterService.deleteNode(id);
        return ResponseEntity.noContent().build();
    }

    // =====================================================================
    // Node job endpoints
    // =====================================================================

    /**
     * Lists the jobs (task assignments) of a node, ordered by priority.
     *
     * @param nodeId the node identifier
     * @return 200 OK with the list of jobs
     */
    @GetMapping("/nodes/{nodeId}/jobs")
    public ResponseEntity<List<ClusterJobDTO>> findJobsByNode(@PathVariable Long nodeId) {
        List<ClusterJobDTO> jobs = clusterJobService.findJobsByNode(nodeId);
        return ResponseEntity.ok(jobs);
    }

    /**
     * Assigns a task to a node, creating a new job.
     *
     * @param nodeId the node identifier
     * @param dto    the job data
     * @return 201 Created with the created job
     */
    @PostMapping("/nodes/{nodeId}/jobs")
    public ResponseEntity<ClusterJobDTO> assignJob(@PathVariable Long nodeId,
                                                   @RequestBody ClusterJobDTO dto) {
        ClusterJobDTO created = clusterJobService.assignJob(nodeId, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Updates a job (priority and/or enabled flag) of a node.
     *
     * @param nodeId the node identifier
     * @param taskId the task identifier
     * @param dto    the job data
     * @return 200 OK with the updated job
     */
    @PutMapping("/nodes/{nodeId}/jobs/{taskId}")
    public ResponseEntity<ClusterJobDTO> updateJob(@PathVariable Long nodeId,
                                                   @PathVariable Long taskId,
                                                   @RequestBody ClusterJobDTO dto) {
        ClusterJobDTO updated = clusterJobService.updateJob(nodeId, taskId, dto);
        return ResponseEntity.ok(updated);
    }

    /**
     * Removes a job (task assignment) from a node.
     *
     * @param nodeId the node identifier
     * @param taskId the task identifier
     * @return 204 No Content
     */
    @DeleteMapping("/nodes/{nodeId}/jobs/{taskId}")
    public ResponseEntity<Void> deleteJob(@PathVariable Long nodeId, @PathVariable Long taskId) {
        clusterJobService.deleteJob(nodeId, taskId);
        return ResponseEntity.noContent().build();
    }

    // =====================================================================
    // Task endpoints
    // =====================================================================

    /**
     * Lists all cluster task definitions (catalog).
     *
     * @return 200 OK with the list of tasks
     */
    @GetMapping("/tasks")
    public ResponseEntity<List<ClusterTaskDTO>> findAllTasks() {
        List<ClusterTaskDTO> tasks = clusterJobService.findAllTasks();
        return ResponseEntity.ok(tasks);
    }

    // =====================================================================
    // Block endpoints
    // =====================================================================

    /**
     * Lists cluster blocks with pagination and optional filters.
     *
     * @param name     optional filter by block name (partial match)
     * @param pageable pagination parameters (page, size, sort)
     * @return 200 OK with paginated block list
     */
    @GetMapping("/blocks")
    public ResponseEntity<Page<ClusterBlockDTO>> findAllBlocks(
            @RequestParam(required = false) String name,
            Pageable pageable) {

        ClusterBlockCriteria criteria = new ClusterBlockCriteria(name);
        Page<ClusterBlockDTO> page = clusterService.findBlocksByCriteria(criteria, pageable);
        return ResponseEntity.ok(page);
    }

    /**
     * Counts cluster blocks matching the given filters.
     *
     * @param name optional filter by block name (partial match)
     * @return 200 OK with the total count
     */
    @GetMapping("/blocks/count")
    public ResponseEntity<Long> countBlocks(@RequestParam(required = false) String name) {
        ClusterBlockCriteria criteria = new ClusterBlockCriteria(name);
        long total = clusterService.countBlocksByCriteria(criteria);
        return ResponseEntity.ok(total);
    }

    /**
     * Retrieves a cluster block by its identifier.
     *
     * @param id the block identifier
     * @return 200 OK with the block, or 404 if not found
     */
    @GetMapping("/blocks/{id}")
    public ResponseEntity<ClusterBlockDTO> findBlockById(@PathVariable Long id) {
        ClusterBlockDTO block = clusterService.findBlockById(id);
        return ResponseEntity.ok(block);
    }

}
