package org.myorganization.template.cluster;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.myorganization.template.cluster.AbstractClusterWorker.CandidateInfo;
import org.myorganization.template.cluster.AbstractClusterWorker.ClusterWorkerLockPort;
import org.myorganization.template.cluster.AbstractClusterWorker.ClusterWorkerTaskPort;
import org.myorganization.template.cluster.AbstractClusterWorker.JobInfo;
import org.myorganization.template.cluster.AbstractClusterWorker.TaskInfo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link AbstractClusterWorker} template method governance flow.
 */
@ExtendWith(MockitoExtension.class)
class AbstractClusterWorkerTest {

    private static final String TASK_NAME = "TEST_TASK";
    private static final Long TASK_ID = 1L;
    private static final Long CURRENT_NODE_ID = 10L;

    @Mock
    private ClusterWorkerTaskPort taskPort;

    @Mock
    private ClusterWorkerLockPort lockPort;

    private TestClusterWorker worker;

    @BeforeEach
    void setUp() {
        worker = new TestClusterWorker(taskPort, lockPort);
    }

    @Test
    void execute_shouldAbort_whenClusterTaskNotFound() {
        when(taskPort.findTaskByName(TASK_NAME)).thenReturn(null);

        worker.execute();

        assertThat(worker.wasExecuted()).isFalse();
        verifyNoInteractions(lockPort);
    }

    @Test
    void execute_shouldAbort_whenCurrentNodeNotRegistered() {
        when(taskPort.findTaskByName(TASK_NAME)).thenReturn(new TaskInfo(TASK_ID, TASK_NAME, 1, 1));
        when(taskPort.getCurrentNodeId()).thenReturn(null);

        worker.execute();

        assertThat(worker.wasExecuted()).isFalse();
        verifyNoInteractions(lockPort);
    }

    @Test
    void execute_shouldAbort_whenNoJobForCurrentNode() {
        when(taskPort.findTaskByName(TASK_NAME)).thenReturn(new TaskInfo(TASK_ID, TASK_NAME, 1, 1));
        when(taskPort.getCurrentNodeId()).thenReturn(CURRENT_NODE_ID);
        when(taskPort.findJobForNodeAndTask(CURRENT_NODE_ID, TASK_ID)).thenReturn(null);

        worker.execute();

        assertThat(worker.wasExecuted()).isFalse();
        verifyNoInteractions(lockPort);
    }

    @Test
    void execute_shouldAbort_whenJobIsDisabled() {
        when(taskPort.findTaskByName(TASK_NAME)).thenReturn(new TaskInfo(TASK_ID, TASK_NAME, 1, 1));
        when(taskPort.getCurrentNodeId()).thenReturn(CURRENT_NODE_ID);
        when(taskPort.findJobForNodeAndTask(CURRENT_NODE_ID, TASK_ID))
                .thenReturn(new JobInfo(CURRENT_NODE_ID, TASK_ID, 1, false));

        worker.execute();

        assertThat(worker.wasExecuted()).isFalse();
        verifyNoInteractions(lockPort);
    }

    @Test
    void execute_shouldAbort_whenNotEnoughAliveNodes() {
        when(taskPort.findTaskByName(TASK_NAME)).thenReturn(new TaskInfo(TASK_ID, TASK_NAME, 1, 3));
        when(taskPort.getCurrentNodeId()).thenReturn(CURRENT_NODE_ID);
        when(taskPort.findJobForNodeAndTask(CURRENT_NODE_ID, TASK_ID))
                .thenReturn(new JobInfo(CURRENT_NODE_ID, TASK_ID, 1, true));
        when(taskPort.countAliveNodes()).thenReturn(2L);

        worker.execute();

        assertThat(worker.wasExecuted()).isFalse();
        verifyNoInteractions(lockPort);
    }

    @Test
    void execute_shouldAbort_whenNodeNotInTopPriorityCandidates() {
        when(taskPort.findTaskByName(TASK_NAME)).thenReturn(new TaskInfo(TASK_ID, TASK_NAME, 1, 1));
        when(taskPort.getCurrentNodeId()).thenReturn(CURRENT_NODE_ID);
        when(taskPort.findJobForNodeAndTask(CURRENT_NODE_ID, TASK_ID))
                .thenReturn(new JobInfo(CURRENT_NODE_ID, TASK_ID, 3, true));
        when(taskPort.countAliveNodes()).thenReturn(3L);
        // Current node (priority 3) is behind nodes 20 (priority 1) and 30 (priority 2)
        when(taskPort.findEnabledCandidatesForTask(TASK_ID)).thenReturn(List.of(
                new CandidateInfo(20L, 1, true),
                new CandidateInfo(30L, 2, true),
                new CandidateInfo(CURRENT_NODE_ID, 3, true)
        ));

        worker.execute();

        assertThat(worker.wasExecuted()).isFalse();
        verifyNoInteractions(lockPort);
    }

    @Test
    void execute_shouldExecute_whenAllConditionsMet_singleNode() {
        when(taskPort.findTaskByName(TASK_NAME)).thenReturn(new TaskInfo(TASK_ID, TASK_NAME, 1, 1));
        when(taskPort.getCurrentNodeId()).thenReturn(CURRENT_NODE_ID);
        when(taskPort.findJobForNodeAndTask(CURRENT_NODE_ID, TASK_ID))
                .thenReturn(new JobInfo(CURRENT_NODE_ID, TASK_ID, 1, true));
        when(taskPort.countAliveNodes()).thenReturn(2L);
        when(taskPort.findEnabledCandidatesForTask(TASK_ID)).thenReturn(List.of(
                new CandidateInfo(CURRENT_NODE_ID, 1, true),
                new CandidateInfo(20L, 2, true)
        ));

        worker.execute();

        assertThat(worker.wasExecuted()).isTrue();
        // No lock should be acquired for single node (nodes == 1)
        verifyNoInteractions(lockPort);
    }

    @Test
    void execute_shouldAcquireAndReleaseLock_whenMultipleNodesConfigured() {
        when(taskPort.findTaskByName(TASK_NAME)).thenReturn(new TaskInfo(TASK_ID, TASK_NAME, 2, 1));
        when(taskPort.getCurrentNodeId()).thenReturn(CURRENT_NODE_ID);
        when(taskPort.findJobForNodeAndTask(CURRENT_NODE_ID, TASK_ID))
                .thenReturn(new JobInfo(CURRENT_NODE_ID, TASK_ID, 1, true));
        when(taskPort.countAliveNodes()).thenReturn(3L);
        when(taskPort.findEnabledCandidatesForTask(TASK_ID)).thenReturn(List.of(
                new CandidateInfo(CURRENT_NODE_ID, 1, true),
                new CandidateInfo(20L, 2, true),
                new CandidateInfo(30L, 3, true)
        ));

        worker.execute();

        assertThat(worker.wasExecuted()).isTrue();
        verify(lockPort).acquireLock(TASK_NAME);
        verify(lockPort).releaseLock(TASK_NAME);
    }

    @Test
    void execute_shouldReleaseLock_evenWhenHandleExecuteThrows() {
        when(taskPort.findTaskByName(TASK_NAME)).thenReturn(new TaskInfo(TASK_ID, TASK_NAME, 2, 1));
        when(taskPort.getCurrentNodeId()).thenReturn(CURRENT_NODE_ID);
        when(taskPort.findJobForNodeAndTask(CURRENT_NODE_ID, TASK_ID))
                .thenReturn(new JobInfo(CURRENT_NODE_ID, TASK_ID, 1, true));
        when(taskPort.countAliveNodes()).thenReturn(2L);
        when(taskPort.findEnabledCandidatesForTask(TASK_ID)).thenReturn(List.of(
                new CandidateInfo(CURRENT_NODE_ID, 1, true),
                new CandidateInfo(20L, 2, true)
        ));

        // Make the worker throw on execute
        worker.setThrowOnExecute(true);

        try {
            worker.execute();
        } catch (RuntimeException e) {
            // Expected
        }

        verify(lockPort).acquireLock(TASK_NAME);
        verify(lockPort).releaseLock(TASK_NAME);
    }

    @Test
    void execute_shouldIgnoreDeadNodes_whenCalculatingCandidates() {
        // Task allows 1 node to execute, current node has priority 2
        // Node with priority 1 is DEAD, so current node should execute
        when(taskPort.findTaskByName(TASK_NAME)).thenReturn(new TaskInfo(TASK_ID, TASK_NAME, 1, 1));
        when(taskPort.getCurrentNodeId()).thenReturn(CURRENT_NODE_ID);
        when(taskPort.findJobForNodeAndTask(CURRENT_NODE_ID, TASK_ID))
                .thenReturn(new JobInfo(CURRENT_NODE_ID, TASK_ID, 2, true));
        when(taskPort.countAliveNodes()).thenReturn(2L);
        // Node 20 has higher priority but is DEAD
        when(taskPort.findEnabledCandidatesForTask(TASK_ID)).thenReturn(List.of(
                new CandidateInfo(20L, 1, false),  // DEAD - should be ignored
                new CandidateInfo(CURRENT_NODE_ID, 2, true)
        ));

        worker.execute();

        assertThat(worker.wasExecuted()).isTrue();
    }

    @Test
    void execute_shouldNotAcquireLock_whenSingleNodeConfigured() {
        when(taskPort.findTaskByName(TASK_NAME)).thenReturn(new TaskInfo(TASK_ID, TASK_NAME, 1, 1));
        when(taskPort.getCurrentNodeId()).thenReturn(CURRENT_NODE_ID);
        when(taskPort.findJobForNodeAndTask(CURRENT_NODE_ID, TASK_ID))
                .thenReturn(new JobInfo(CURRENT_NODE_ID, TASK_ID, 1, true));
        when(taskPort.countAliveNodes()).thenReturn(1L);
        when(taskPort.findEnabledCandidatesForTask(TASK_ID)).thenReturn(List.of(
                new CandidateInfo(CURRENT_NODE_ID, 1, true)
        ));

        worker.execute();

        assertThat(worker.wasExecuted()).isTrue();
        verify(lockPort, never()).acquireLock(TASK_NAME);
        verify(lockPort, never()).releaseLock(TASK_NAME);
    }

    @Test
    void execute_shouldAllowSecondNode_whenNodesConfigAllowsTwo() {
        // Task allows 2 nodes, current node has priority 2
        when(taskPort.findTaskByName(TASK_NAME)).thenReturn(new TaskInfo(TASK_ID, TASK_NAME, 2, 1));
        when(taskPort.getCurrentNodeId()).thenReturn(CURRENT_NODE_ID);
        when(taskPort.findJobForNodeAndTask(CURRENT_NODE_ID, TASK_ID))
                .thenReturn(new JobInfo(CURRENT_NODE_ID, TASK_ID, 2, true));
        when(taskPort.countAliveNodes()).thenReturn(3L);
        when(taskPort.findEnabledCandidatesForTask(TASK_ID)).thenReturn(List.of(
                new CandidateInfo(20L, 1, true),
                new CandidateInfo(CURRENT_NODE_ID, 2, true),
                new CandidateInfo(30L, 3, true)
        ));

        worker.execute();

        assertThat(worker.wasExecuted()).isTrue();
        verify(lockPort).acquireLock(TASK_NAME);
        verify(lockPort).releaseLock(TASK_NAME);
    }

    // =====================================================================
    // Test helper: concrete subclass for testing
    // =====================================================================

    private static class TestClusterWorker extends AbstractClusterWorker {

        private boolean executed = false;
        private boolean throwOnExecute = false;

        TestClusterWorker(ClusterWorkerTaskPort taskPort, ClusterWorkerLockPort lockPort) {
            super(taskPort, lockPort);
        }

        @Override
        protected String getTaskName() {
            return TASK_NAME;
        }

        @Override
        protected void handleExecute() {
            if (throwOnExecute) {
                throw new RuntimeException("Simulated execution failure");
            }
            executed = true;
        }

        boolean wasExecuted() {
            return executed;
        }

        void setThrowOnExecute(boolean throwOnExecute) {
            this.throwOnExecute = throwOnExecute;
        }
    }
}
