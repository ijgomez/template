package org.myorganization.template.cluster;

import java.util.ArrayList;
import java.util.List;

import net.jqwik.api.Assume;
import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.constraints.IntRange;
import org.mockito.InOrder;
import org.mockito.Mockito;
import org.myorganization.template.cluster.AbstractClusterWorker.CandidateInfo;
import org.myorganization.template.cluster.AbstractClusterWorker.ClusterWorkerLockPort;
import org.myorganization.template.cluster.AbstractClusterWorker.ClusterWorkerTaskPort;
import org.myorganization.template.cluster.AbstractClusterWorker.JobInfo;
import org.myorganization.template.cluster.AbstractClusterWorker.TaskInfo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Property-based tests for {@link AbstractClusterWorker} execution governance.
 * <p>
 * Validates: Requirements 38.1, 38.3, 38.5, 38.7
 * <p>
 * Property 17: Cluster task execution governance —
 * For any cluster state (alive nodes, task config, job priorities), only the top-N priority
 * nodes with enabled jobs execute the task; others abort.
 */
class AbstractClusterWorkerGovernancePropertyTest {

    private static final String TASK_NAME = "TEST_TASK";
    private static final Long TASK_ID = 1L;

    // =====================================================================
    // Property 1: aliveNodesBelowMinNodes_neverExecutes
    // =====================================================================

    /**
     * **Validates: Requirements 38.1, 38.3**
     * <p>
     * For any minNodes in [2,10] and aliveCount in [1, minNodes-1],
     * the worker must never execute handleExecute().
     */
    @Property
    void aliveNodesBelowMinNodes_neverExecutes(
            @ForAll @IntRange(min = 2, max = 10) int minNodes,
            @ForAll @IntRange(min = 1, max = 9) int aliveCount) {

        Assume.that(aliveCount < minNodes);

        ClusterWorkerTaskPort taskPort = Mockito.mock(ClusterWorkerTaskPort.class);
        ClusterWorkerLockPort lockPort = Mockito.mock(ClusterWorkerLockPort.class);

        Long currentNodeId = 100L;

        when(taskPort.findTaskByName(TASK_NAME)).thenReturn(new TaskInfo(TASK_ID, TASK_NAME, 1, minNodes));
        when(taskPort.getCurrentNodeId()).thenReturn(currentNodeId);
        when(taskPort.findJobForNodeAndTask(currentNodeId, TASK_ID))
                .thenReturn(new JobInfo(currentNodeId, TASK_ID, 1, true));
        when(taskPort.countAliveNodes()).thenReturn((long) aliveCount);

        TestClusterWorker worker = new TestClusterWorker(taskPort, lockPort);
        worker.execute();

        assertThat(worker.wasExecuted())
                .as("Should NOT execute when aliveCount(%d) < minNodes(%d)", aliveCount, minNodes)
                .isFalse();
    }

    // =====================================================================
    // Property 2: currentNodeNotInTopN_neverExecutes
    // =====================================================================

    /**
     * **Validates: Requirements 38.5**
     * <p>
     * For any taskNodes in [1,5] and a candidate list of [3,10] nodes where the
     * current node is positioned AFTER the first taskNodes candidates,
     * the worker must never execute handleExecute().
     */
    @Property
    void currentNodeNotInTopN_neverExecutes(
            @ForAll @IntRange(min = 1, max = 5) int taskNodes,
            @ForAll @IntRange(min = 3, max = 10) int totalCandidates) {

        Assume.that(totalCandidates > taskNodes);

        ClusterWorkerTaskPort taskPort = Mockito.mock(ClusterWorkerTaskPort.class);
        ClusterWorkerLockPort lockPort = Mockito.mock(ClusterWorkerLockPort.class);

        Long currentNodeId = 999L;

        // Place currentNode at position taskNodes (0-indexed), i.e. just after the top-N
        int currentNodePosition = taskNodes; // beyond top-N (0-indexed positions 0..taskNodes-1 are top)
        Assume.that(currentNodePosition < totalCandidates);

        List<CandidateInfo> candidates = new ArrayList<>();
        for (int i = 0; i < totalCandidates; i++) {
            long nodeId = (i == currentNodePosition) ? currentNodeId : (i + 1L);
            candidates.add(new CandidateInfo(nodeId, i + 1, true));
        }

        when(taskPort.findTaskByName(TASK_NAME)).thenReturn(new TaskInfo(TASK_ID, TASK_NAME, taskNodes, 1));
        when(taskPort.getCurrentNodeId()).thenReturn(currentNodeId);
        when(taskPort.findJobForNodeAndTask(currentNodeId, TASK_ID))
                .thenReturn(new JobInfo(currentNodeId, TASK_ID, currentNodePosition + 1, true));
        when(taskPort.countAliveNodes()).thenReturn((long) totalCandidates);
        when(taskPort.findEnabledCandidatesForTask(TASK_ID)).thenReturn(candidates);

        TestClusterWorker worker = new TestClusterWorker(taskPort, lockPort);
        worker.execute();

        assertThat(worker.wasExecuted())
                .as("Should NOT execute when currentNode is at position %d and taskNodes=%d",
                        currentNodePosition, taskNodes)
                .isFalse();
    }

    // =====================================================================
    // Property 3: currentNodeInTopN_andAliveEnough_alwaysExecutes
    // =====================================================================

    /**
     * **Validates: Requirements 38.3, 38.5, 38.7**
     * <p>
     * For any taskNodes in [1,5], minNodes in [1,3], aliveCount >= minNodes, and
     * current node positioned WITHIN the first taskNodes candidates,
     * the worker must always execute handleExecute().
     */
    @Property
    void currentNodeInTopN_andAliveEnough_alwaysExecutes(
            @ForAll @IntRange(min = 1, max = 5) int taskNodes,
            @ForAll @IntRange(min = 1, max = 3) int minNodes,
            @ForAll @IntRange(min = 1, max = 10) int totalCandidates,
            @ForAll @IntRange(min = 0, max = 4) int currentNodePosition) {

        Assume.that(totalCandidates >= taskNodes);
        Assume.that(currentNodePosition < taskNodes);
        Assume.that(currentNodePosition < totalCandidates);
        long aliveCount = Math.max(minNodes, totalCandidates);

        ClusterWorkerTaskPort taskPort = Mockito.mock(ClusterWorkerTaskPort.class);
        ClusterWorkerLockPort lockPort = Mockito.mock(ClusterWorkerLockPort.class);

        Long currentNodeId = 999L;

        List<CandidateInfo> candidates = new ArrayList<>();
        for (int i = 0; i < totalCandidates; i++) {
            long nodeId = (i == currentNodePosition) ? currentNodeId : (i + 1L);
            candidates.add(new CandidateInfo(nodeId, i + 1, true));
        }

        when(taskPort.findTaskByName(TASK_NAME)).thenReturn(new TaskInfo(TASK_ID, TASK_NAME, taskNodes, minNodes));
        when(taskPort.getCurrentNodeId()).thenReturn(currentNodeId);
        when(taskPort.findJobForNodeAndTask(currentNodeId, TASK_ID))
                .thenReturn(new JobInfo(currentNodeId, TASK_ID, currentNodePosition + 1, true));
        when(taskPort.countAliveNodes()).thenReturn(aliveCount);
        when(taskPort.findEnabledCandidatesForTask(TASK_ID)).thenReturn(candidates);

        TestClusterWorker worker = new TestClusterWorker(taskPort, lockPort);
        worker.execute();

        assertThat(worker.wasExecuted())
                .as("Should execute when currentNode is at position %d within top-%d and alive(%d)>=minNodes(%d)",
                        currentNodePosition, taskNodes, aliveCount, minNodes)
                .isTrue();
    }

    // =====================================================================
    // Property 4: lockAcquiredOnlyWhenMultipleNodes
    // =====================================================================

    /**
     * **Validates: Requirements 38.7**
     * <p>
     * When taskNodes == 1 the lock is NEVER acquired.
     * When taskNodes > 1 the lock IS acquired before handleExecute() and released after.
     */
    @Property
    void lockAcquiredOnlyWhenMultipleNodes(
            @ForAll @IntRange(min = 1, max = 5) int taskNodes,
            @ForAll @IntRange(min = 2, max = 8) int totalCandidates) {

        Assume.that(totalCandidates >= taskNodes);

        ClusterWorkerTaskPort taskPort = Mockito.mock(ClusterWorkerTaskPort.class);
        ClusterWorkerLockPort lockPort = Mockito.mock(ClusterWorkerLockPort.class);

        Long currentNodeId = 999L;

        // Place current node at position 0 (top priority) so it always executes
        List<CandidateInfo> candidates = new ArrayList<>();
        candidates.add(new CandidateInfo(currentNodeId, 1, true));
        for (int i = 1; i < totalCandidates; i++) {
            candidates.add(new CandidateInfo((long) (i + 1), i + 1, true));
        }

        when(taskPort.findTaskByName(TASK_NAME)).thenReturn(new TaskInfo(TASK_ID, TASK_NAME, taskNodes, 1));
        when(taskPort.getCurrentNodeId()).thenReturn(currentNodeId);
        when(taskPort.findJobForNodeAndTask(currentNodeId, TASK_ID))
                .thenReturn(new JobInfo(currentNodeId, TASK_ID, 1, true));
        when(taskPort.countAliveNodes()).thenReturn((long) totalCandidates);
        when(taskPort.findEnabledCandidatesForTask(TASK_ID)).thenReturn(candidates);

        TestClusterWorker worker = new TestClusterWorker(taskPort, lockPort);
        worker.execute();

        // The worker should always execute in this scenario
        assertThat(worker.wasExecuted()).isTrue();

        if (taskNodes == 1) {
            // No lock acquired for single-node task
            verify(lockPort, never()).acquireLock(TASK_NAME);
            verify(lockPort, never()).releaseLock(TASK_NAME);
        } else {
            // Lock acquired and released for multi-node task, in order
            InOrder order = inOrder(lockPort);
            order.verify(lockPort).acquireLock(TASK_NAME);
            order.verify(lockPort).releaseLock(TASK_NAME);
        }
    }

    // =====================================================================
    // Test helper: concrete subclass for testing
    // =====================================================================

    private static class TestClusterWorker extends AbstractClusterWorker {

        private boolean executed = false;

        TestClusterWorker(ClusterWorkerTaskPort taskPort, ClusterWorkerLockPort lockPort) {
            super(taskPort, lockPort);
        }

        @Override
        protected String getTaskName() {
            return TASK_NAME;
        }

        @Override
        protected void handleExecute() {
            executed = true;
        }

        boolean wasExecuted() {
            return executed;
        }
    }
}
