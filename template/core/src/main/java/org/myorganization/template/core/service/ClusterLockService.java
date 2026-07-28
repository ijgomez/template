package org.myorganization.template.core.service;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;

import org.myorganization.template.cluster.HeartbeatLockService;
import org.myorganization.template.core.repository.ClusterBlockRepository;
import org.myorganization.template.domain.entity.ClusterBlock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Centralized cluster lock service providing mutual exclusion at two levels:
 * <ul>
 *   <li><b>Intra-instance</b>: Java ReentrantLock per resource name (thread-level)</li>
 *   <li><b>Inter-instance</b>: PostgreSQL advisory lock (node-level)</li>
 * </ul>
 * <p>
 * On acquire, records the start time in ClusterBlock using database time (not JVM time)
 * to avoid clock drift between nodes.
 * <p>
 * On release, calculates the duration and updates ClusterBlock metrics:
 * total, avg, min, max.
 */
@Service
public class ClusterLockService implements HeartbeatLockService {

    private static final Logger log = LoggerFactory.getLogger(ClusterLockService.class);

    private final ConcurrentHashMap<String, ReentrantLock> intraInstanceLocks = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, OffsetDateTime> lockStartTimes = new ConcurrentHashMap<>();

    private final ClusterBlockRepository clusterBlockRepository;

    public ClusterLockService(ClusterBlockRepository clusterBlockRepository) {
        this.clusterBlockRepository = clusterBlockRepository;
    }

    /**
     * Acquires a lock identified by resource name, providing both intra-instance
     * (thread-level) and inter-instance (database-level) exclusion.
     * <p>
     * This method blocks until both locks are acquired.
     * <p>
     * On successful acquisition, records the start time in ClusterBlock using
     * database time to avoid clock drift.
     *
     * @param resourceName the name of the resource/task to lock
     */
    @Override
    @Transactional
    public void acquireLock(String resourceName) {
        // 1. Intra-instance lock (thread-level within same JVM)
        ReentrantLock lock = intraInstanceLocks.computeIfAbsent(resourceName, k -> new ReentrantLock());
        lock.lock();

        try {
            // 2. Inter-instance lock (PostgreSQL advisory lock)
            int lockKey = computeLockKey(resourceName);
            clusterBlockRepository.acquireAdvisoryLock(lockKey);

            // 3. Record start time using database time (avoids clock drift)
            ensureClusterBlockExists(resourceName);
            clusterBlockRepository.updateStartDateWithDbTime(resourceName);

            // Store DB time for duration calculation on release
            OffsetDateTime dbTime = clusterBlockRepository.getDatabaseTime();
            lockStartTimes.put(resourceName, dbTime);

            log.debug("Lock acquired for resource: {}", resourceName);
        } catch (Exception e) {
            // If DB lock fails, release the intra-instance lock
            lock.unlock();
            throw e;
        }
    }

    /**
     * Releases a lock identified by resource name and updates ClusterBlock metrics.
     * <p>
     * Calculates the duration since acquisition (using database time) and updates:
     * <ul>
     *   <li>total = total + 1</li>
     *   <li>avg = ((avg * (total-1)) + duration) / total (running average)</li>
     *   <li>min = Math.min(existing min, duration)</li>
     *   <li>max = Math.max(existing max, duration)</li>
     * </ul>
     *
     * @param resourceName the name of the resource/task to unlock
     */
    @Override
    @Transactional
    public void releaseLock(String resourceName) {
        try {
            // 1. Calculate duration using database time
            OffsetDateTime startTime = lockStartTimes.remove(resourceName);
            OffsetDateTime endTime = clusterBlockRepository.getDatabaseTime();

            if (startTime != null && endTime != null) {
                long durationMs = Duration.between(startTime, endTime).toMillis();
                updateBlockMetrics(resourceName, durationMs);
            }

            // 2. Release inter-instance lock (PostgreSQL advisory lock)
            int lockKey = computeLockKey(resourceName);
            clusterBlockRepository.releaseAdvisoryLock(lockKey);

            log.debug("Lock released for resource: {}", resourceName);
        } finally {
            // 3. Release intra-instance lock
            ReentrantLock lock = intraInstanceLocks.get(resourceName);
            if (lock != null && lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }

    /**
     * Checks if a resource currently has an active lock held by any thread in this instance.
     *
     * @param resourceName the name of the resource to check
     * @return true if the resource has an active lock, false otherwise
     */
    public boolean isLocked(String resourceName) {
        ReentrantLock lock = intraInstanceLocks.get(resourceName);
        return lock != null && lock.isLocked();
    }

    // =====================================================================
    // Private helpers
    // =====================================================================

    /**
     * Computes an integer lock key from the resource name for use with PostgreSQL advisory locks.
     * Uses the hashCode of the resource name.
     *
     * @param resourceName the resource name
     * @return an integer key for advisory lock
     */
    private int computeLockKey(String resourceName) {
        return resourceName.hashCode();
    }

    /**
     * Ensures a ClusterBlock record exists for the given resource name.
     * If it does not exist, creates one with initial values.
     *
     * @param resourceName the resource/task name
     */
    private void ensureClusterBlockExists(String resourceName) {
        if (clusterBlockRepository.findByName(resourceName).isEmpty()) {
            ClusterBlock block = new ClusterBlock();
            block.setName(resourceName);
            block.setAvgTime(0L);
            block.setMinTime(0L);
            block.setMaxTime(0L);
            block.setTotal(0L);
            clusterBlockRepository.save(block);
        }
    }

    /**
     * Updates the ClusterBlock metrics for a given resource after lock release.
     * <p>
     * Calculates running average, min, max and increments total.
     *
     * @param resourceName the resource name
     * @param durationMs   the duration of the lock in milliseconds
     */
    private void updateBlockMetrics(String resourceName, long durationMs) {
        ClusterBlock block = clusterBlockRepository.findByName(resourceName).orElse(null);
        if (block == null) {
            log.warn("ClusterBlock not found for resource: {}", resourceName);
            return;
        }

        long previousTotal = block.getTotal() != null ? block.getTotal() : 0L;
        long newTotal = previousTotal + 1;

        // Running average: ((avg * previousTotal) + duration) / newTotal
        long previousAvg = block.getAvgTime() != null ? block.getAvgTime() : 0L;
        long newAvg = ((previousAvg * previousTotal) + durationMs) / newTotal;

        // Min time
        long previousMin = block.getMinTime() != null ? block.getMinTime() : 0L;
        long newMin = (previousTotal == 0) ? durationMs : Math.min(previousMin, durationMs);

        // Max time
        long previousMax = block.getMaxTime() != null ? block.getMaxTime() : 0L;
        long newMax = Math.max(previousMax, durationMs);

        block.setTotal(newTotal);
        block.setAvgTime(newAvg);
        block.setMinTime(newMin);
        block.setMaxTime(newMax);

        clusterBlockRepository.save(block);

        log.debug("ClusterBlock metrics updated for '{}': total={}, avg={}ms, min={}ms, max={}ms",
                resourceName, newTotal, newAvg, newMin, newMax);
    }
}
