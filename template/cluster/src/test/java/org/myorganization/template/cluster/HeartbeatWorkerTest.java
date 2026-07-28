package org.myorganization.template.cluster;

import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link HeartbeatWorker}.
 */
@ExtendWith(MockitoExtension.class)
class HeartbeatWorkerTest {

    @Mock
    private HeartbeatClusterService clusterService;

    @Mock
    private HeartbeatLockService lockService;

    private TestableHeartbeatWorker heartbeatWorker;

    @BeforeEach
    void setUp() {
        heartbeatWorker = new TestableHeartbeatWorker(clusterService, lockService);
    }

    @Test
    @DisplayName("First execution should register node and call onFirstInvocation")
    void firstExecutionRegistersNodeAndCallsOnFirstInvocation() {
        when(clusterService.detectDeadNodes()).thenReturn(Collections.emptyList());

        heartbeatWorker.execute();

        verify(clusterService).registerNode();
        assertThat(heartbeatWorker.firstInvocationCalled).isTrue();
    }

    @Test
    @DisplayName("First execution should register node before acquiring lock")
    void firstExecutionRegistersBeforeLock() {
        when(clusterService.detectDeadNodes()).thenReturn(Collections.emptyList());

        heartbeatWorker.execute();

        InOrder order = inOrder(clusterService, lockService);
        order.verify(clusterService).registerNode();
        order.verify(lockService).acquireLock("NODOS");
    }

    @Test
    @DisplayName("Subsequent executions should not register node or call onFirstInvocation again")
    void subsequentExecutionsSkipRegistration() {
        when(clusterService.detectDeadNodes()).thenReturn(Collections.emptyList());

        heartbeatWorker.execute();
        heartbeatWorker.firstInvocationCalled = false; // reset to verify it's not called again
        heartbeatWorker.execute();

        verify(clusterService, times(1)).registerNode();
        assertThat(heartbeatWorker.firstInvocationCalled).isFalse();
    }

    @Test
    @DisplayName("Normal execution acquires lock, heartbeats, detects dead nodes, elects master, releases lock")
    void normalExecutionFlow() {
        when(clusterService.detectDeadNodes()).thenReturn(Collections.emptyList());

        heartbeatWorker.execute();

        InOrder order = inOrder(lockService, clusterService);
        order.verify(lockService).acquireLock("NODOS");
        order.verify(clusterService).heartbeat();
        order.verify(clusterService).detectDeadNodes();
        order.verify(clusterService).electMaster();
        order.verify(lockService).releaseLock("NODOS");
    }

    @Test
    @DisplayName("Should call onDeadNodeDetected for each dead node hostname")
    void callsOnDeadNodeDetectedForEachDeadNode() {
        when(clusterService.detectDeadNodes()).thenReturn(List.of("node-1", "node-2", "node-3"));

        heartbeatWorker.execute();

        assertThat(heartbeatWorker.deadNodeHostnames).containsExactly("node-1", "node-2", "node-3");
    }

    @Test
    @DisplayName("Should not call onDeadNodeDetected when no dead nodes found")
    void doesNotCallOnDeadNodeDetectedWhenNoDeadNodes() {
        when(clusterService.detectDeadNodes()).thenReturn(Collections.emptyList());

        heartbeatWorker.execute();

        assertThat(heartbeatWorker.deadNodeHostnames).isEmpty();
    }

    @Test
    @DisplayName("Lock should be released even if heartbeat throws exception")
    void lockReleasedOnHeartbeatException() {
        doThrow(new RuntimeException("heartbeat failed")).when(clusterService).heartbeat();

        heartbeatWorker.execute();

        verify(lockService).releaseLock("NODOS");
    }

    @Test
    @DisplayName("Lock should be released even if detectDeadNodes throws exception")
    void lockReleasedOnDetectDeadNodesException() {
        when(clusterService.detectDeadNodes()).thenThrow(new RuntimeException("detection failed"));

        heartbeatWorker.execute();

        verify(lockService).releaseLock("NODOS");
    }

    @Test
    @DisplayName("Lock should be released even if electMaster throws exception")
    void lockReleasedOnElectMasterException() {
        when(clusterService.detectDeadNodes()).thenReturn(Collections.emptyList());
        doThrow(new RuntimeException("election failed")).when(clusterService).electMaster();

        heartbeatWorker.execute();

        verify(lockService).releaseLock("NODOS");
    }

    @Test
    @DisplayName("Should handle acquireLock failure gracefully without calling heartbeat logic")
    void handlesAcquireLockFailure() {
        doThrow(new RuntimeException("lock failed")).when(lockService).acquireLock("NODOS");

        heartbeatWorker.execute();

        verify(clusterService, never()).heartbeat();
        verify(clusterService, never()).detectDeadNodes();
        verify(clusterService, never()).electMaster();
    }

    @Test
    @DisplayName("Should handle registerNode failure gracefully on first invocation")
    void handlesRegisterNodeFailure() {
        doThrow(new RuntimeException("register failed")).when(clusterService).registerNode();

        heartbeatWorker.execute();

        // Should not propagate the exception - execution continues
        // But lock operations won't happen due to the outer catch
        verify(clusterService).registerNode();
    }

    // =========================================================================
    // Test subclass that exposes extension point behavior for verification
    // =========================================================================

    private static class TestableHeartbeatWorker extends HeartbeatWorker {

        boolean firstInvocationCalled = false;
        final java.util.List<String> deadNodeHostnames = new java.util.ArrayList<>();

        TestableHeartbeatWorker(HeartbeatClusterService clusterService, HeartbeatLockService lockService) {
            super(clusterService, lockService);
        }

        @Override
        protected void onFirstInvocation() {
            firstInvocationCalled = true;
        }

        @Override
        protected void onDeadNodeDetected(String hostname) {
            deadNodeHostnames.add(hostname);
        }
    }
}
