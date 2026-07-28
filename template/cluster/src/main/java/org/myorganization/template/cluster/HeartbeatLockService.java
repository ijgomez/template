package org.myorganization.template.cluster;

/**
 * Interface defining the lock operations required by the HeartbeatWorker.
 * <p>
 * This interface lives in the cluster module to avoid a circular dependency
 * with the core module. The concrete implementation resides in core.
 */
public interface HeartbeatLockService {

    /**
     * Acquires a lock identified by resource name, blocking until available.
     *
     * @param resourceName the name of the resource to lock
     */
    void acquireLock(String resourceName);

    /**
     * Releases a lock identified by resource name and updates metrics.
     *
     * @param resourceName the name of the resource to unlock
     */
    void releaseLock(String resourceName);
}
