package org.myorganization.template.cluster;

import java.util.List;

/**
 * Interface defining the cluster operations required by the HeartbeatWorker.
 * <p>
 * This interface lives in the cluster module to avoid a circular dependency
 * with the core module. The concrete implementation resides in core.
 */
public interface HeartbeatClusterService {

    /**
     * Auto-registers the current node on startup (create or update by hostname).
     */
    void registerNode();

    /**
     * Updates the current node's status to ALIVE with fresh memory data and last_modified_at.
     */
    void heartbeat();

    /**
     * Detects nodes with last_modified_at older than 5 minutes and marks them as DEAD.
     *
     * @return list of hostnames of nodes that were marked as DEAD
     */
    List<String> detectDeadNodes();

    /**
     * Auto-elects a master if no ALIVE node with master=true exists.
     */
    void electMaster();
}
