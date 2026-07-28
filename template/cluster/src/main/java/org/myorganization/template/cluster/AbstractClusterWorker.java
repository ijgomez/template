package org.myorganization.template.cluster;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Abstract base class for cluster-governed tasks.
 * <p>
 * Implements the template method pattern for task execution governance:
 * <ol>
 *   <li>Get task name via {@link #getTaskName()}</li>
 *   <li>Verify ClusterTask exists</li>
 *   <li>Verify ClusterJob is enabled for the current node</li>
 *   <li>Verify ALIVE nodes &ge; minNodes</li>
 *   <li>Calculate if current node should execute based on priority</li>
 *   <li>Acquire lock if nodes &gt; 1</li>
 *   <li>Call {@link #handleExecute()}</li>
 *   <li>Release lock in finally block</li>
 * </ol>
 * <p>
 * Subclasses must implement {@link #handleExecute()} and {@link #getTaskName()},
 * and provide the required port implementations via constructor injection.
 */
public abstract class AbstractClusterWorker {

    private static final Logger log = LoggerFactory.getLogger(AbstractClusterWorker.class);

    private final ClusterWorkerTaskPort taskPort;
    private final ClusterWorkerLockPort lockPort;

    /**
     * Creates a new AbstractClusterWorker with the required ports.
     *
     * @param taskPort port for querying cluster task/job/node information
     * @param lockPort port for acquiring and releasing cluster locks
     */
    protected AbstractClusterWorker(ClusterWorkerTaskPort taskPort, ClusterWorkerLockPort lockPort) {
        this.taskPort = taskPort;
        this.lockPort = lockPort;
    }

    /**
     * Template method that orchestrates the cluster task execution governance flow.
     * <p>
     * Verifies all preconditions before executing, acquires a lock if multiple nodes
     * can execute the task concurrently, and releases it in a finally block.
     */
    public void execute() {
        String taskName = getTaskName();

        // 1. Verify ClusterTask exists
        TaskInfo taskInfo = taskPort.findTaskByName(taskName);
        if (taskInfo == null) {
            log.warn("ClusterTask not found for name '{}'. Aborting execution.", taskName);
            return;
        }

        // 2. Verify ClusterJob enabled for current node
        Long currentNodeId = taskPort.getCurrentNodeId();
        if (currentNodeId == null) {
            log.warn("Current node not registered in cluster. Aborting execution of task '{}'.", taskName);
            return;
        }

        JobInfo jobInfo = taskPort.findJobForNodeAndTask(currentNodeId, taskInfo.taskId());
        if (jobInfo == null || !jobInfo.enabled()) {
            log.debug("No enabled ClusterJob for node {} and task '{}'. Aborting.", currentNodeId, taskName);
            return;
        }

        // 3. Verify ALIVE nodes >= minNodes
        long aliveCount = taskPort.countAliveNodes();
        if (aliveCount < taskInfo.minNodes()) {
            log.debug("Not enough ALIVE nodes ({}) for task '{}' (minNodes={}). Aborting.",
                    aliveCount, taskName, taskInfo.minNodes());
            return;
        }

        // 4. Calculate if current node should execute (based on priority and task.nodes)
        if (!shouldCurrentNodeExecute(taskInfo, currentNodeId)) {
            log.debug("Node {} is not among the top {} priority candidates for task '{}'. Aborting.",
                    currentNodeId, taskInfo.nodes(), taskName);
            return;
        }

        // 5. Acquire lock if nodes > 1
        boolean lockAcquired = false;
        if (taskInfo.nodes() > 1) {
            lockPort.acquireLock(taskName);
            lockAcquired = true;
        }

        try {
            // 6. Execute the task
            handleExecute();
        } finally {
            // 7. Release lock if acquired
            if (lockAcquired) {
                lockPort.releaseLock(taskName);
            }
        }
    }

    /**
     * Determines if the current node should execute the task based on priority ranking.
     * <p>
     * Gets all enabled jobs for the task ordered by priority (ascending), filters to only
     * those whose node is ALIVE, and checks if the current node is within the top N candidates
     * where N = task.nodes.
     *
     * @param taskInfo      the task configuration
     * @param currentNodeId the current node's identifier
     * @return true if the current node should execute
     */
    private boolean shouldCurrentNodeExecute(TaskInfo taskInfo, Long currentNodeId) {
        List<CandidateInfo> candidates = taskPort.findEnabledCandidatesForTask(taskInfo.taskId());

        // Filter to only ALIVE nodes with enabled = true
        List<CandidateInfo> aliveCandidates = candidates.stream()
                .filter(CandidateInfo::nodeAlive)
                .toList();

        // Check if current node is within the top N priority positions
        int maxExecutors = taskInfo.nodes();
        for (int i = 0; i < Math.min(maxExecutors, aliveCandidates.size()); i++) {
            if (aliveCandidates.get(i).nodeId().equals(currentNodeId)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Returns the name of the cluster task this worker handles.
     * Must match a name registered in the CLUSTER_TASK table.
     *
     * @return the task name
     */
    protected abstract String getTaskName();

    /**
     * Contains the actual business logic of the cluster task.
     * Called only after all governance checks pass.
     */
    protected abstract void handleExecute();

    // =====================================================================
    // Port interfaces (dependency inversion for module isolation)
    // =====================================================================

    /**
     * Port interface for querying cluster task, job, and node information.
     * Implemented by the core module's service layer.
     */
    public interface ClusterWorkerTaskPort {

        /**
         * Finds a cluster task by its unique name.
         *
         * @param name the task name
         * @return task info or null if not found
         */
        TaskInfo findTaskByName(String name);

        /**
         * Gets the current node's identifier (based on hostname).
         *
         * @return the current node's ID, or null if not registered
         */
        Long getCurrentNodeId();

        /**
         * Finds the job assignment for a given node and task.
         *
         * @param nodeId the node identifier
         * @param taskId the task identifier
         * @return job info or null if no assignment exists
         */
        JobInfo findJobForNodeAndTask(Long nodeId, Long taskId);

        /**
         * Counts the number of nodes with ALIVE status.
         *
         * @return the count of alive nodes
         */
        long countAliveNodes();

        /**
         * Finds all enabled candidate jobs for a task, ordered by priority (ascending).
         * Each candidate includes whether its node is ALIVE.
         *
         * @param taskId the task identifier
         * @return ordered list of candidates
         */
        List<CandidateInfo> findEnabledCandidatesForTask(Long taskId);
    }

    /**
     * Port interface for cluster lock operations.
     * Implemented by the core module's ClusterLockService.
     */
    public interface ClusterWorkerLockPort {

        /**
         * Acquires a lock identified by resource name.
         *
         * @param resourceName the name of the resource/task to lock
         */
        void acquireLock(String resourceName);

        /**
         * Releases a lock identified by resource name.
         *
         * @param resourceName the name of the resource/task to unlock
         */
        void releaseLock(String resourceName);
    }

    // =====================================================================
    // Value objects for port communication
    // =====================================================================

    /**
     * Immutable record holding cluster task configuration.
     *
     * @param taskId   the task identifier
     * @param name     the task name
     * @param nodes    max number of nodes that can execute this task simultaneously
     * @param minNodes minimum ALIVE nodes required for execution
     */
    public record TaskInfo(Long taskId, String name, int nodes, int minNodes) {
    }

    /**
     * Immutable record holding job assignment information for a node/task pair.
     *
     * @param nodeId   the node identifier
     * @param taskId   the task identifier
     * @param priority the priority value (lower = higher priority)
     * @param enabled  whether the assignment is active
     */
    public record JobInfo(Long nodeId, Long taskId, int priority, boolean enabled) {
    }

    /**
     * Immutable record holding candidate information for priority calculation.
     *
     * @param nodeId    the node identifier
     * @param priority  the priority value (lower = higher priority)
     * @param nodeAlive whether the node currently has ALIVE status
     */
    public record CandidateInfo(Long nodeId, int priority, boolean nodeAlive) {
    }
}
