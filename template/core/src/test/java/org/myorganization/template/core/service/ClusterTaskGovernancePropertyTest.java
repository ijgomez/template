package org.myorganization.template.core.service;

import java.util.ArrayList;
import java.util.List;

import net.jqwik.api.Assume;
import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.constraints.IntRange;
import org.mockito.Mockito;
import org.myorganization.template.cluster.AbstractClusterWorker;
import org.myorganization.template.cluster.AbstractClusterWorker.CandidateInfo;
import org.myorganization.template.cluster.AbstractClusterWorker.ClusterWorkerLockPort;
import org.myorganization.template.cluster.AbstractClusterWorker.ClusterWorkerTaskPort;
import org.myorganization.template.cluster.AbstractClusterWorker.JobInfo;
import org.myorganization.template.cluster.AbstractClusterWorker.TaskInfo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * Property-based test for cluster task execution governance at the core/service level.
 *
 * <p><b>Validates: Requirements 38.1, 38.2, 38.3, 38.4, 38.5, 38.8</b></p>
 *
 * <p>Property 17: For any cluster config (task, jobs, node states), AbstractClusterWorker
 * decisions follow: no task &rarr; abort, no enabled job &rarr; abort,
 * ALIVE &lt; minNodes &rarr; abort, not in top N priority &rarr; abort, else &rarr; execute.</p>
 */
class ClusterTaskGovernancePropertyTest {

    private static final String TASK_NAME = "GOVERNANCE_TASK";
    private static final Long TASK_ID = 10L;
    private static final Long CURRENT_NODE_ID = 500L;

    // =====================================================================
    // Property 1: No task found -> abort (never executes)
    // =====================================================================

    /**
     * <b>Validates: Requirement 38.1</b>
     * <p>
     * For any node/job configuration, if the ClusterTask does not exist,
     * the worker must never execute handleExecute().
     */
    @Property(tries = 50)
    void noTaskFound_neverExecutes(@ForAll @IntRange(min = 1, max = 10) int aliveNodes) {
        ClusterWorkerTaskPort taskPort = Mockito.mock(ClusterWorkerTaskPort.class);
        ClusterWorkerLockPort lockPort = Mockito.mock(ClusterWorkerLockPort.class);

        when(taskPort.findTaskByName(TASK_NAME)).thenReturn(null);

        TestWorker worker = new TestWorker(taskPort, lockPort);
        worker.execute();

        assertThat(worker.wasExecuted())
                .as("Should NOT execute when task '%s' does not exist", TASK_NAME)
                .isFalse();
    }

    // =====================================================================
    // Property 2: No enabled job for current node -> abort
    // =====================================================================

    /**
     * <b>Validates: Requirement 38.2</b>
     * <p>
     * For any valid task config, if the current node has no enabled job for that task,
     * the worker must never execute handleExecute().
     */
    @Property(tries = 50)
    void noEnabledJobForNode_neverExecutes(
            @ForAll @IntRange(min = 1, max = 5) int taskNodes,
            @ForAll @IntRange(min = 1, max = 3) int minNodes,
            @ForAll @IntRange(min = 1, max = 10) int aliveCount) {

        Assume.that(aliveCount >= minNodes);

        ClusterWorkerTaskPort taskPort = Mockito.mock(ClusterWorkerTaskPort.class);
        ClusterWorkerLockPort lockPort = Mockito.mock(ClusterWorkerLockPort.class);

        when(taskPort.findTaskByName(TASK_NAME))
                .thenReturn(new TaskInfo(TASK_ID, TASK_NAME, taskNodes, minNodes));
        when(taskPort.getCurrentNodeId()).thenReturn(CURRENT_NODE_ID);
        when(taskPort.findJobForNodeAndTask(CURRENT_NODE_ID, TASK_ID)).thenReturn(null);

        TestWorker worker = new TestWorker(taskPort, lockPort);
        worker.execute();

        assertThat(worker.wasExecuted())
                .as("Should NOT execute when no enabled job exists for node %d", CURRENT_NODE_ID)
                .isFalse();
    }

    /**
     * <b>Validates: Requirement 38.2</b>
     * <p>
     * For any valid task config, if the current node's job exists but is disabled,
     * the worker must never execute handleExecute().
     */
    @Property(tries = 50)
    void disabledJobForNode_neverExecutes(
            @ForAll @IntRange(min = 1, max = 5) int taskNodes,
            @ForAll @IntRange(min = 1, max = 3) int minNodes,
            @ForAll @IntRange(min = 1, max = 10) int aliveCount) {

        Assume.that(aliveCount >= minNodes);

        ClusterWorkerTaskPort taskPort = Mockito.mock(ClusterWorkerTaskPort.class);
        ClusterWorkerLockPort lockPort = Mockito.mock(ClusterWorkerLockPort.class);

        when(taskPort.findTaskByName(TASK_NAME))
                .thenReturn(new TaskInfo(TASK_ID, TASK_NAME, taskNodes, minNodes));
        when(taskPort.getCurrentNodeId()).thenReturn(CURRENT_NODE_ID);
        when(taskPort.findJobForNodeAndTask(CURRENT_NODE_ID, TASK_ID))
                .thenReturn(new JobInfo(CURRENT_NODE_ID, TASK_ID, 1, false));

        TestWorker worker = new TestWorker(taskPort, lockPort);
        worker.execute();

        assertThat(worker.wasExecuted())
                .as("Should NOT execute when job is disabled for node %d", CURRENT_NODE_ID)
                .isFalse();
    }

    // =====================================================================
    // Property 3: ALIVE nodes < minNodes -> abort
    // =====================================================================

    /**
     * <b>Validates: Requirement 38.3</b>
     * <p>
     * For any minNodes in [2,10] and aliveCount strictly below minNodes,
     * the worker must never execute handleExecute().
     */
    @Property(tries = 50)
    void aliveNodesBelowMinNodes_neverExecutes(
            @ForAll @IntRange(min = 2, max = 10) int minNodes,
            @ForAll @IntRange(min = 1, max = 9) int aliveCount) {

        Assume.that(aliveCount < minNodes);

        ClusterWorkerTaskPort taskPort = Mockito.mock(ClusterWorkerTaskPort.class);
        ClusterWorkerLockPort lockPort = Mockito.mock(ClusterWorkerLockPort.class);

        when(taskPort.findTaskByName(TASK_NAME))
                .thenReturn(new TaskInfo(TASK_ID, TASK_NAME, 1, minNodes));
        when(taskPort.getCurrentNodeId()).thenReturn(CURRENT_NODE_ID);
        when(taskPort.findJobForNodeAndTask(CURRENT_NODE_ID, TASK_ID))
                .thenReturn(new JobInfo(CURRENT_NODE_ID, TASK_ID, 1, true));
        when(taskPort.countAliveNodes()).thenReturn((long) aliveCount);

        TestWorker worker = new TestWorker(taskPort, lockPort);
        worker.execute();

        assertThat(worker.wasExecuted())
                .as("Should NOT execute when aliveCount(%d) < minNodes(%d)", aliveCount, minNodes)
                .isFalse();
    }

    // =====================================================================
    // Property 4: Node not in top N priority -> abort
    // =====================================================================

    /**
     * <b>Validates: Requirement 38.4, 38.5</b>
     * <p>
     * For any taskNodes in [1,5] and a candidate list where the current node
     * is positioned AFTER the top-N slots, the worker must never execute.
     */
    @Property(tries = 50)
    void nodeNotInTopNPriority_neverExecutes(
            @ForAll @IntRange(min = 1, max = 5) int taskNodes,
            @ForAll @IntRange(min = 3, max = 10) int totalCandidates) {

        Assume.that(totalCandidates > taskNodes);

        ClusterWorkerTaskPort taskPort = Mockito.mock(ClusterWorkerTaskPort.class);
        ClusterWorkerLockPort lockPort = Mockito.mock(ClusterWorkerLockPort.class);

        int currentNodePosition = taskNodes;
        Assume.that(currentNodePosition < totalCandidates);

        List<CandidateInfo> candidates = new ArrayList<>();
        for (int i = 0; i < totalCandidates; i++) {
            long nodeId = (i == currentNodePosition) ? CURRENT_NODE_ID : (i + 1L);
            candidates.add(new CandidateInfo(nodeId, i + 1, true));
        }

        when(taskPort.findTaskByName(TASK_NAME))
                .thenReturn(new TaskInfo(TASK_ID, TASK_NAME, taskNodes, 1));
        when(taskPort.getCurrentNodeId()).thenReturn(CURRENT_NODE_ID);
        when(taskPort.findJobForNodeAndTask(CURRENT_NODE_ID, TASK_ID))
                .thenReturn(new JobInfo(CURRENT_NODE_ID, TASK_ID, currentNodePosition + 1, true));
        when(taskPort.countAliveNodes()).thenReturn((long) totalCandidates);
        when(taskPort.findEnabledCandidatesForTask(TASK_ID)).thenReturn(candidates);

        TestWorker worker = new TestWorker(taskPort, lockPort);
        worker.execute();

        assertThat(worker.wasExecuted())
                .as("Should NOT execute when currentNode at priority position %d > top-%d",
                        currentNodePosition, taskNodes)
                .isFalse();
    }

    // =====================================================================
    // Property 5: All conditions met -> execute
    // =====================================================================

    /**
     * <b>Validates: Requirement 38.5, 38.8</b>
     * <p>
     * For any valid config where task exists, job is enabled, aliveCount >= minNodes,
     * and the current node is within the top-N priority candidates, the worker MUST execute.
     */
    @Property(tries = 50)
    void allConditionsMet_alwaysExecutes(
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

        List<CandidateInfo> candidates = new ArrayList<>();
        for (int i = 0; i < totalCandidates; i++) {
            long nodeId = (i == currentNodePosition) ? CURRENT_NODE_ID : (i + 1L);
            candidates.add(new CandidateInfo(nodeId, i + 1, true));
        }

        when(taskPort.findTaskByName(TASK_NAME))
                .thenReturn(new TaskInfo(TASK_ID, TASK_NAME, taskNodes, minNodes));
        when(taskPort.getCurrentNodeId()).thenReturn(CURRENT_NODE_ID);
        when(taskPort.findJobForNodeAndTask(CURRENT_NODE_ID, TASK_ID))
                .thenReturn(new JobInfo(CURRENT_NODE_ID, TASK_ID, currentNodePosition + 1, true));
        when(taskPort.countAliveNodes()).thenReturn(aliveCount);
        when(taskPort.findEnabledCandidatesForTask(TASK_ID)).thenReturn(candidates);

        TestWorker worker = new TestWorker(taskPort, lockPort);
        worker.execute();

        assertThat(worker.wasExecuted())
                .as("Should execute when all governance conditions are met: " +
                                "position=%d < taskNodes=%d, alive=%d >= minNodes=%d",
                        currentNodePosition, taskNodes, aliveCount, minNodes)
                .isTrue();
    }

    // =====================================================================
    // Property 6: Current node not registered -> abort
    // =====================================================================

    /**
     * <b>Validates: Requirement 38.1</b>
     * <p>
     * If the current node is not registered in the cluster (getCurrentNodeId returns null),
     * the worker must never execute.
     */
    @Property(tries = 30)
    void currentNodeNotRegistered_neverExecutes(
            @ForAll @IntRange(min = 1, max = 5) int taskNodes,
            @ForAll @IntRange(min = 1, max = 3) int minNodes) {

        ClusterWorkerTaskPort taskPort = Mockito.mock(ClusterWorkerTaskPort.class);
        ClusterWorkerLockPort lockPort = Mockito.mock(ClusterWorkerLockPort.class);

        when(taskPort.findTaskByName(TASK_NAME))
                .thenReturn(new TaskInfo(TASK_ID, TASK_NAME, taskNodes, minNodes));
        when(taskPort.getCurrentNodeId()).thenReturn(null);

        TestWorker worker = new TestWorker(taskPort, lockPort);
        worker.execute();

        assertThat(worker.wasExecuted())
                .as("Should NOT execute when current node is not registered in cluster")
                .isFalse();
    }

    // =====================================================================
    // Test helper: concrete subclass for testing
    // =====================================================================

    private static class TestWorker extends AbstractClusterWorker {

        private boolean executed = false;

        TestWorker(ClusterWorkerTaskPort taskPort, ClusterWorkerLockPort lockPort) {
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
