package org.myorganization.template.core.service;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.myorganization.template.core.repository.ClusterBlockRepository;
import org.myorganization.template.domain.entity.ClusterBlock;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClusterLockServiceTest {

    @Mock
    private ClusterBlockRepository clusterBlockRepository;

    private ClusterLockService clusterLockService;

    @BeforeEach
    void setUp() {
        clusterLockService = new ClusterLockService(clusterBlockRepository);
    }

    @Nested
    @DisplayName("acquireLock")
    class AcquireLock {

        @Test
        @DisplayName("acquires intra-instance and inter-instance lock and records start time")
        void acquiresLockAndRecordsStartTime() {
            String resourceName = "TEST_RESOURCE";
            OffsetDateTime dbTime = OffsetDateTime.now(ZoneOffset.UTC);

            when(clusterBlockRepository.findByName(resourceName)).thenReturn(Optional.of(createBlock(resourceName)));
            when(clusterBlockRepository.getDatabaseTime()).thenReturn(dbTime);

            clusterLockService.acquireLock(resourceName);

            // Verify advisory lock was acquired
            verify(clusterBlockRepository).acquireAdvisoryLock(resourceName.hashCode());
            // Verify start_date was updated with DB time
            verify(clusterBlockRepository).updateStartDateWithDbTime(resourceName);
            // Verify DB time was retrieved for later duration calc
            verify(clusterBlockRepository).getDatabaseTime();
            // Verify the lock is reported as held
            assertThat(clusterLockService.isLocked(resourceName)).isTrue();

            // Cleanup: release the lock to avoid test pollution
            when(clusterBlockRepository.findByName(resourceName)).thenReturn(Optional.of(createBlock(resourceName)));
            when(clusterBlockRepository.getDatabaseTime()).thenReturn(dbTime.plusSeconds(1));
            clusterLockService.releaseLock(resourceName);
        }

        @Test
        @DisplayName("creates ClusterBlock if not exists on first acquire")
        void createsClusterBlockIfNotExists() {
            String resourceName = "NEW_RESOURCE";
            OffsetDateTime dbTime = OffsetDateTime.now(ZoneOffset.UTC);

            when(clusterBlockRepository.findByName(resourceName)).thenReturn(Optional.empty());
            when(clusterBlockRepository.save(any(ClusterBlock.class))).thenAnswer(inv -> inv.getArgument(0));
            when(clusterBlockRepository.getDatabaseTime()).thenReturn(dbTime);

            clusterLockService.acquireLock(resourceName);

            // Verify a new ClusterBlock was created
            ArgumentCaptor<ClusterBlock> captor = ArgumentCaptor.forClass(ClusterBlock.class);
            verify(clusterBlockRepository).save(captor.capture());
            ClusterBlock saved = captor.getValue();
            assertThat(saved.getName()).isEqualTo(resourceName);
            assertThat(saved.getAvgTime()).isEqualTo(0L);
            assertThat(saved.getMinTime()).isEqualTo(0L);
            assertThat(saved.getMaxTime()).isEqualTo(0L);
            assertThat(saved.getTotal()).isEqualTo(0L);

            // Cleanup
            when(clusterBlockRepository.findByName(resourceName)).thenReturn(Optional.of(createBlock(resourceName)));
            when(clusterBlockRepository.getDatabaseTime()).thenReturn(dbTime.plusSeconds(1));
            clusterLockService.releaseLock(resourceName);
        }

        @Test
        @DisplayName("releases intra-instance lock if advisory lock fails")
        void releasesIntraLockOnAdvisoryLockFailure() {
            String resourceName = "FAILING_RESOURCE";

            // Simulate advisory lock failure (void method requires doThrow syntax)
            doThrow(new RuntimeException("DB connection failed"))
                    .when(clusterBlockRepository).acquireAdvisoryLock(anyInt());

            assertThatThrownBy(() -> clusterLockService.acquireLock(resourceName))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("DB connection failed");

            // After failure, intra-instance lock should be released
            assertThat(clusterLockService.isLocked(resourceName)).isFalse();
        }

        @Test
        @DisplayName("uses hashCode of resource name as advisory lock key")
        void usesHashCodeAsLockKey() {
            String resourceName = "NODOS";
            OffsetDateTime dbTime = OffsetDateTime.now(ZoneOffset.UTC);

            when(clusterBlockRepository.findByName(resourceName)).thenReturn(Optional.of(createBlock(resourceName)));
            when(clusterBlockRepository.getDatabaseTime()).thenReturn(dbTime);

            clusterLockService.acquireLock(resourceName);

            verify(clusterBlockRepository).acquireAdvisoryLock(eq("NODOS".hashCode()));

            // Cleanup
            when(clusterBlockRepository.findByName(resourceName)).thenReturn(Optional.of(createBlock(resourceName)));
            when(clusterBlockRepository.getDatabaseTime()).thenReturn(dbTime.plusSeconds(1));
            clusterLockService.releaseLock(resourceName);
        }
    }

    @Nested
    @DisplayName("releaseLock")
    class ReleaseLock {

        @Test
        @DisplayName("releases lock and updates metrics with calculated duration")
        void releasesLockAndUpdatesMetrics() {
            String resourceName = "TASK_A";
            OffsetDateTime startTime = OffsetDateTime.of(2024, 6, 15, 10, 0, 0, 0, ZoneOffset.UTC);
            OffsetDateTime endTime = OffsetDateTime.of(2024, 6, 15, 10, 0, 2, 0, ZoneOffset.UTC); // 2 seconds later

            ClusterBlock block = createBlock(resourceName);
            block.setTotal(0L);
            block.setAvgTime(0L);
            block.setMinTime(0L);
            block.setMaxTime(0L);

            // Acquire first
            when(clusterBlockRepository.findByName(resourceName)).thenReturn(Optional.of(block));
            when(clusterBlockRepository.getDatabaseTime()).thenReturn(startTime);
            clusterLockService.acquireLock(resourceName);

            // Now release
            when(clusterBlockRepository.getDatabaseTime()).thenReturn(endTime);
            when(clusterBlockRepository.findByName(resourceName)).thenReturn(Optional.of(block));
            when(clusterBlockRepository.save(any(ClusterBlock.class))).thenAnswer(inv -> inv.getArgument(0));

            clusterLockService.releaseLock(resourceName);

            // Verify advisory lock released
            verify(clusterBlockRepository).releaseAdvisoryLock(resourceName.hashCode());

            // Verify metrics updated
            ArgumentCaptor<ClusterBlock> captor = ArgumentCaptor.forClass(ClusterBlock.class);
            verify(clusterBlockRepository).save(captor.capture());
            ClusterBlock updatedBlock = captor.getValue();
            assertThat(updatedBlock.getTotal()).isEqualTo(1L);
            assertThat(updatedBlock.getAvgTime()).isEqualTo(2000L); // 2 seconds = 2000ms
            assertThat(updatedBlock.getMinTime()).isEqualTo(2000L);
            assertThat(updatedBlock.getMaxTime()).isEqualTo(2000L);

            // Lock should no longer be held
            assertThat(clusterLockService.isLocked(resourceName)).isFalse();
        }

        @Test
        @DisplayName("updates running average correctly on second release")
        void updatesRunningAverageCorrectly() {
            String resourceName = "TASK_B";
            OffsetDateTime startTime = OffsetDateTime.of(2024, 6, 15, 10, 0, 0, 0, ZoneOffset.UTC);
            OffsetDateTime endTime = OffsetDateTime.of(2024, 6, 15, 10, 0, 3, 0, ZoneOffset.UTC); // 3s = 3000ms

            // Block already has one execution: avg=1000, min=1000, max=1000, total=1
            ClusterBlock block = createBlock(resourceName);
            block.setTotal(1L);
            block.setAvgTime(1000L);
            block.setMinTime(1000L);
            block.setMaxTime(1000L);

            // Acquire
            when(clusterBlockRepository.findByName(resourceName)).thenReturn(Optional.of(block));
            when(clusterBlockRepository.getDatabaseTime()).thenReturn(startTime);
            clusterLockService.acquireLock(resourceName);

            // Release (3 seconds later)
            when(clusterBlockRepository.getDatabaseTime()).thenReturn(endTime);
            when(clusterBlockRepository.findByName(resourceName)).thenReturn(Optional.of(block));
            when(clusterBlockRepository.save(any(ClusterBlock.class))).thenAnswer(inv -> inv.getArgument(0));

            clusterLockService.releaseLock(resourceName);

            ArgumentCaptor<ClusterBlock> captor = ArgumentCaptor.forClass(ClusterBlock.class);
            verify(clusterBlockRepository).save(captor.capture());
            ClusterBlock updated = captor.getValue();

            // Running avg: ((1000 * 1) + 3000) / 2 = 2000
            assertThat(updated.getTotal()).isEqualTo(2L);
            assertThat(updated.getAvgTime()).isEqualTo(2000L);
            assertThat(updated.getMinTime()).isEqualTo(1000L); // min stays 1000
            assertThat(updated.getMaxTime()).isEqualTo(3000L); // max updated to 3000
        }

        @Test
        @DisplayName("releases intra-instance lock even when DB operations fail")
        void releasesIntraLockOnDbFailure() {
            String resourceName = "FAILING_RELEASE";
            OffsetDateTime startTime = OffsetDateTime.now(ZoneOffset.UTC);

            // Acquire first
            when(clusterBlockRepository.findByName(resourceName)).thenReturn(Optional.of(createBlock(resourceName)));
            when(clusterBlockRepository.getDatabaseTime()).thenReturn(startTime);
            clusterLockService.acquireLock(resourceName);

            assertThat(clusterLockService.isLocked(resourceName)).isTrue();

            // Simulate DB failure on release
            when(clusterBlockRepository.getDatabaseTime()).thenThrow(new RuntimeException("DB failure"));

            try {
                clusterLockService.releaseLock(resourceName);
            } catch (RuntimeException ignored) {
                // Expected
            }

            // Intra-instance lock should still be released in the finally block
            assertThat(clusterLockService.isLocked(resourceName)).isFalse();
        }
    }

    @Nested
    @DisplayName("isLocked")
    class IsLocked {

        @Test
        @DisplayName("returns false when no lock has been acquired for resource")
        void returnsFalseWhenNoLockAcquired() {
            assertThat(clusterLockService.isLocked("UNKNOWN_RESOURCE")).isFalse();
        }

        @Test
        @DisplayName("returns true when lock is held")
        void returnsTrueWhenLockHeld() {
            String resourceName = "LOCKED_RESOURCE";
            OffsetDateTime dbTime = OffsetDateTime.now(ZoneOffset.UTC);

            when(clusterBlockRepository.findByName(resourceName)).thenReturn(Optional.of(createBlock(resourceName)));
            when(clusterBlockRepository.getDatabaseTime()).thenReturn(dbTime);

            clusterLockService.acquireLock(resourceName);

            assertThat(clusterLockService.isLocked(resourceName)).isTrue();

            // Cleanup
            when(clusterBlockRepository.findByName(resourceName)).thenReturn(Optional.of(createBlock(resourceName)));
            when(clusterBlockRepository.getDatabaseTime()).thenReturn(dbTime.plusSeconds(1));
            clusterLockService.releaseLock(resourceName);
        }

        @Test
        @DisplayName("returns false after lock is released")
        void returnsFalseAfterRelease() {
            String resourceName = "RELEASED_RESOURCE";
            OffsetDateTime dbTime = OffsetDateTime.now(ZoneOffset.UTC);

            when(clusterBlockRepository.findByName(resourceName)).thenReturn(Optional.of(createBlock(resourceName)));
            when(clusterBlockRepository.getDatabaseTime()).thenReturn(dbTime);

            clusterLockService.acquireLock(resourceName);
            assertThat(clusterLockService.isLocked(resourceName)).isTrue();

            when(clusterBlockRepository.getDatabaseTime()).thenReturn(dbTime.plusSeconds(1));
            when(clusterBlockRepository.save(any(ClusterBlock.class))).thenAnswer(inv -> inv.getArgument(0));
            clusterLockService.releaseLock(resourceName);

            assertThat(clusterLockService.isLocked(resourceName)).isFalse();
        }
    }

    @Nested
    @DisplayName("Metrics calculation")
    class MetricsCalculation {

        @Test
        @DisplayName("first lock sets min equal to duration")
        void firstLockSetsMinToDuration() {
            String resourceName = "FIRST_LOCK";
            OffsetDateTime startTime = OffsetDateTime.of(2024, 1, 1, 0, 0, 0, 0, ZoneOffset.UTC);
            OffsetDateTime endTime = OffsetDateTime.of(2024, 1, 1, 0, 0, 5, 0, ZoneOffset.UTC); // 5s

            ClusterBlock block = createBlock(resourceName);
            block.setTotal(0L);
            block.setAvgTime(0L);
            block.setMinTime(0L);
            block.setMaxTime(0L);

            when(clusterBlockRepository.findByName(resourceName)).thenReturn(Optional.of(block));
            when(clusterBlockRepository.getDatabaseTime()).thenReturn(startTime);
            clusterLockService.acquireLock(resourceName);

            when(clusterBlockRepository.getDatabaseTime()).thenReturn(endTime);
            when(clusterBlockRepository.findByName(resourceName)).thenReturn(Optional.of(block));
            when(clusterBlockRepository.save(any(ClusterBlock.class))).thenAnswer(inv -> inv.getArgument(0));

            clusterLockService.releaseLock(resourceName);

            ArgumentCaptor<ClusterBlock> captor = ArgumentCaptor.forClass(ClusterBlock.class);
            verify(clusterBlockRepository).save(captor.capture());
            ClusterBlock updated = captor.getValue();

            assertThat(updated.getMinTime()).isEqualTo(5000L);
            assertThat(updated.getMaxTime()).isEqualTo(5000L);
            assertThat(updated.getAvgTime()).isEqualTo(5000L);
            assertThat(updated.getTotal()).isEqualTo(1L);
        }

        @Test
        @DisplayName("min is updated when new duration is shorter")
        void minUpdatedWhenShorter() {
            String resourceName = "MIN_TEST";
            OffsetDateTime startTime = OffsetDateTime.of(2024, 1, 1, 0, 0, 0, 0, ZoneOffset.UTC);
            OffsetDateTime endTime = OffsetDateTime.of(2024, 1, 1, 0, 0, 1, 0, ZoneOffset.UTC); // 1s

            // Previous: avg=5000, min=3000, max=7000, total=2
            ClusterBlock block = createBlock(resourceName);
            block.setTotal(2L);
            block.setAvgTime(5000L);
            block.setMinTime(3000L);
            block.setMaxTime(7000L);

            when(clusterBlockRepository.findByName(resourceName)).thenReturn(Optional.of(block));
            when(clusterBlockRepository.getDatabaseTime()).thenReturn(startTime);
            clusterLockService.acquireLock(resourceName);

            when(clusterBlockRepository.getDatabaseTime()).thenReturn(endTime);
            when(clusterBlockRepository.findByName(resourceName)).thenReturn(Optional.of(block));
            when(clusterBlockRepository.save(any(ClusterBlock.class))).thenAnswer(inv -> inv.getArgument(0));

            clusterLockService.releaseLock(resourceName);

            ArgumentCaptor<ClusterBlock> captor = ArgumentCaptor.forClass(ClusterBlock.class);
            verify(clusterBlockRepository).save(captor.capture());
            ClusterBlock updated = captor.getValue();

            // New duration = 1000ms, shorter than min=3000
            assertThat(updated.getMinTime()).isEqualTo(1000L);
            assertThat(updated.getMaxTime()).isEqualTo(7000L); // unchanged
            // avg: ((5000 * 2) + 1000) / 3 = 11000/3 = 3666
            assertThat(updated.getAvgTime()).isEqualTo(3666L);
            assertThat(updated.getTotal()).isEqualTo(3L);
        }

        @Test
        @DisplayName("max is updated when new duration is longer")
        void maxUpdatedWhenLonger() {
            String resourceName = "MAX_TEST";
            OffsetDateTime startTime = OffsetDateTime.of(2024, 1, 1, 0, 0, 0, 0, ZoneOffset.UTC);
            OffsetDateTime endTime = OffsetDateTime.of(2024, 1, 1, 0, 0, 10, 0, ZoneOffset.UTC); // 10s

            // Previous: avg=5000, min=3000, max=7000, total=2
            ClusterBlock block = createBlock(resourceName);
            block.setTotal(2L);
            block.setAvgTime(5000L);
            block.setMinTime(3000L);
            block.setMaxTime(7000L);

            when(clusterBlockRepository.findByName(resourceName)).thenReturn(Optional.of(block));
            when(clusterBlockRepository.getDatabaseTime()).thenReturn(startTime);
            clusterLockService.acquireLock(resourceName);

            when(clusterBlockRepository.getDatabaseTime()).thenReturn(endTime);
            when(clusterBlockRepository.findByName(resourceName)).thenReturn(Optional.of(block));
            when(clusterBlockRepository.save(any(ClusterBlock.class))).thenAnswer(inv -> inv.getArgument(0));

            clusterLockService.releaseLock(resourceName);

            ArgumentCaptor<ClusterBlock> captor = ArgumentCaptor.forClass(ClusterBlock.class);
            verify(clusterBlockRepository).save(captor.capture());
            ClusterBlock updated = captor.getValue();

            // New duration = 10000ms, longer than max=7000
            assertThat(updated.getMaxTime()).isEqualTo(10000L);
            assertThat(updated.getMinTime()).isEqualTo(3000L); // unchanged
            // avg: ((5000 * 2) + 10000) / 3 = 20000/3 = 6666
            assertThat(updated.getAvgTime()).isEqualTo(6666L);
            assertThat(updated.getTotal()).isEqualTo(3L);
        }
    }

    // =====================================================================
    // Helper methods
    // =====================================================================

    private ClusterBlock createBlock(String name) {
        ClusterBlock block = new ClusterBlock();
        block.setId(1L);
        block.setName(name);
        block.setStartDate(OffsetDateTime.now(ZoneOffset.UTC));
        block.setAvgTime(0L);
        block.setMinTime(0L);
        block.setMaxTime(0L);
        block.setTotal(0L);
        return block;
    }
}
