package org.myorganization.template.cluster;

import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;

/**
 * Scheduled task that performs the cluster heartbeat cycle every 30 seconds (configurable).
 * <p>
 * On each execution:
 * <ol>
 *   <li>On first invocation: registers the node and calls {@link #onFirstInvocation()}</li>
 *   <li>Acquires a lock on the "NODOS" resource</li>
 *   <li>Updates the current node (status ALIVE, memory data, last_modified_at)</li>
 *   <li>Detects dead nodes (last_modified_at &gt; 5 min) and marks them DEAD</li>
 *   <li>For each dead node detected, calls {@link #onDeadNodeDetected(String)}</li>
 *   <li>Auto-elects a master if no ALIVE master exists</li>
 *   <li>Releases the lock</li>
 * </ol>
 * <p>
 * Subclasses can override the extension points:
 * <ul>
 *   <li>{@link #onDeadNodeDetected(String)} - react when a node is marked DEAD</li>
 *   <li>{@link #onFirstInvocation()} - logic to execute on first heartbeat after startup</li>
 * </ul>
 *
 * @see HeartbeatClusterService
 * @see HeartbeatLockService
 */
public class HeartbeatWorker {

    private static final Logger log = LoggerFactory.getLogger(HeartbeatWorker.class);

    private static final String LOCK_RESOURCE = "NODOS";

    private final HeartbeatClusterService clusterService;
    private final HeartbeatLockService lockService;
    private final AtomicBoolean firstInvocation = new AtomicBoolean(true);

    public HeartbeatWorker(HeartbeatClusterService clusterService, HeartbeatLockService lockService) {
        this.clusterService = clusterService;
        this.lockService = lockService;
    }

    /**
     * Scheduled heartbeat execution. Interval is configured via the property
     * {@code cluster.heartbeat-interval} with a default of 30000 ms.
     */
    @Scheduled(fixedDelayString = "${cluster.heartbeat-interval:30000}")
    public void execute() {
        try {
            if (firstInvocation.compareAndSet(true, false)) {
                handleFirstInvocation();
            }

            lockService.acquireLock(LOCK_RESOURCE);
            try {
                clusterService.heartbeat();

                List<String> deadNodeHostnames = clusterService.detectDeadNodes();
                for (String hostname : deadNodeHostnames) {
                    onDeadNodeDetected(hostname);
                }

                clusterService.electMaster();
            } finally {
                lockService.releaseLock(LOCK_RESOURCE);
            }
        } catch (Exception e) {
            log.error("Error during heartbeat execution", e);
        }
    }

    /**
     * Handles first invocation: registers the node and calls the extension point.
     */
    private void handleFirstInvocation() {
        log.info("HeartbeatWorker: first invocation - registering node");
        clusterService.registerNode();
        onFirstInvocation();
    }

    /**
     * Extension point called when a dead node is detected.
     * <p>
     * Default implementation is a no-op. Subclasses can override to react
     * to dead node detection (e.g., redistribute tasks, send alerts).
     *
     * @param hostname the hostname of the node marked as DEAD
     */
    protected void onDeadNodeDetected(String hostname) {
        // No-op by default. Subclasses can override.
    }

    /**
     * Extension point called on the first heartbeat invocation after startup.
     * <p>
     * Default implementation is a no-op. Subclasses can override to perform
     * initialization logic that requires the node to be registered.
     */
    protected void onFirstInvocation() {
        // No-op by default. Subclasses can override.
    }
}
