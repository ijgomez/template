package org.myorganization.template.core.service;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.myorganization.template.core.repository.ClusterJobRepository;
import org.myorganization.template.core.repository.ClusterNodeRepository;
import org.myorganization.template.core.repository.ClusterTaskRepository;
import org.myorganization.template.domain.dto.AuditLogEntry;
import org.myorganization.template.domain.dto.ClusterJobDTO;
import org.myorganization.template.domain.dto.ClusterTaskDTO;
import org.myorganization.template.domain.entity.ClusterJob;
import org.myorganization.template.domain.entity.ClusterJobPK;
import org.myorganization.template.domain.entity.ClusterNode;
import org.myorganization.template.domain.entity.ClusterTask;
import org.myorganization.template.domain.enums.AuditSection;
import org.myorganization.template.domain.enums.NodeStatus;
import org.myorganization.template.domain.enums.OperationType;
import org.myorganization.template.domain.exception.DuplicateEntityException;
import org.myorganization.template.domain.exception.EntityNotFoundException;
import org.myorganization.template.domain.exception.ValidationException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClusterJobServiceTest {

    @Mock
    private ClusterNodeRepository clusterNodeRepository;

    @Mock
    private ClusterTaskRepository clusterTaskRepository;

    @Mock
    private ClusterJobRepository clusterJobRepository;

    @Mock
    private AuditService auditService;

    private ClusterJobService clusterJobService;

    @BeforeEach
    void setUp() {
        clusterJobService = new ClusterJobService(
                clusterNodeRepository, clusterTaskRepository, clusterJobRepository, auditService);
    }

    // =====================================================================
    // findJobsByNode
    // =====================================================================

    @Nested
    @DisplayName("findJobsByNode")
    class FindJobsByNode {

        @Test
        @DisplayName("returns jobs of the node as DTOs ordered by priority")
        void returnsJobs() {
            when(clusterNodeRepository.findById(1L)).thenReturn(Optional.of(node(1L)));
            when(clusterJobRepository.findByClusterNodeIdOrderByPriorityAsc(1L))
                    .thenReturn(List.of(job(1L, 10L, 1, true), job(1L, 20L, 2, false)));

            List<ClusterJobDTO> result = clusterJobService.findJobsByNode(1L);

            assertThat(result).hasSize(2);
            assertThat(result.get(0).clusterTaskId()).isEqualTo(10L);
            assertThat(result.get(0).priority()).isEqualTo(1);
            assertThat(result.get(1).clusterTaskId()).isEqualTo(20L);
        }

        @Test
        @DisplayName("throws EntityNotFoundException when node does not exist")
        void nodeNotFound() {
            when(clusterNodeRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> clusterJobService.findJobsByNode(99L))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("ClusterNode");
        }
    }

    // =====================================================================
    // assignJob
    // =====================================================================

    @Nested
    @DisplayName("assignJob")
    class AssignJob {

        @Test
        @DisplayName("creates the job, ignores body nodeId, defaults enabled and audits with nodeId:taskId")
        void assignsOk() {
            when(clusterNodeRepository.findById(1L)).thenReturn(Optional.of(node(1L)));
            when(clusterTaskRepository.findById(10L)).thenReturn(Optional.of(task(10L)));
            when(clusterJobRepository.existsById(new ClusterJobPK(1L, 10L))).thenReturn(false);
            when(clusterJobRepository.save(any(ClusterJob.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            // Body nodeId (999L) must be ignored in favour of the path nodeId (1L)
            ClusterJobDTO result = clusterJobService.assignJob(1L, new ClusterJobDTO(999L, 10L, 3, null));

            assertThat(result.clusterNodeId()).isEqualTo(1L);
            assertThat(result.clusterTaskId()).isEqualTo(10L);
            assertThat(result.priority()).isEqualTo(3);
            assertThat(result.enabled()).isTrue();

            ArgumentCaptor<ClusterJob> jobCaptor = ArgumentCaptor.forClass(ClusterJob.class);
            verify(clusterJobRepository).save(jobCaptor.capture());
            assertThat(jobCaptor.getValue().getId().getClusterNodeId()).isEqualTo(1L);
            assertThat(jobCaptor.getValue().getEnabled()).isTrue();

            assertAudit(OperationType.CREATE, "1:10");
        }

        @Test
        @DisplayName("throws ValidationException when clusterTaskId is null")
        void taskIdNull() {
            when(clusterNodeRepository.findById(1L)).thenReturn(Optional.of(node(1L)));

            assertThatThrownBy(() -> clusterJobService.assignJob(1L, new ClusterJobDTO(1L, null, 1, true)))
                    .isInstanceOf(ValidationException.class);

            verify(clusterJobRepository, never()).save(any());
            verify(auditService, never()).log(any());
        }

        @Test
        @DisplayName("throws ValidationException when priority is negative")
        void negativePriority() {
            when(clusterNodeRepository.findById(1L)).thenReturn(Optional.of(node(1L)));

            assertThatThrownBy(() -> clusterJobService.assignJob(1L, new ClusterJobDTO(1L, 10L, -1, true)))
                    .isInstanceOf(ValidationException.class);

            verify(clusterJobRepository, never()).save(any());
        }

        @Test
        @DisplayName("throws EntityNotFoundException when task does not exist")
        void taskNotFound() {
            when(clusterNodeRepository.findById(1L)).thenReturn(Optional.of(node(1L)));
            when(clusterTaskRepository.findById(10L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> clusterJobService.assignJob(1L, new ClusterJobDTO(1L, 10L, 1, true)))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("ClusterTask");
        }

        @Test
        @DisplayName("throws EntityNotFoundException when node does not exist")
        void nodeNotFound() {
            when(clusterNodeRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> clusterJobService.assignJob(99L, new ClusterJobDTO(99L, 10L, 1, true)))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("ClusterNode");
        }

        @Test
        @DisplayName("throws DuplicateEntityException when the job already exists")
        void duplicate() {
            when(clusterNodeRepository.findById(1L)).thenReturn(Optional.of(node(1L)));
            when(clusterTaskRepository.findById(10L)).thenReturn(Optional.of(task(10L)));
            when(clusterJobRepository.existsById(new ClusterJobPK(1L, 10L))).thenReturn(true);

            assertThatThrownBy(() -> clusterJobService.assignJob(1L, new ClusterJobDTO(1L, 10L, 1, true)))
                    .isInstanceOf(DuplicateEntityException.class);

            verify(clusterJobRepository, never()).save(any());
        }
    }

    // =====================================================================
    // updateJob
    // =====================================================================

    @Nested
    @DisplayName("updateJob")
    class UpdateJob {

        @Test
        @DisplayName("updates priority/enabled and audits with nodeId:taskId")
        void updatesOk() {
            when(clusterNodeRepository.findById(1L)).thenReturn(Optional.of(node(1L)));
            when(clusterJobRepository.findById(new ClusterJobPK(1L, 10L)))
                    .thenReturn(Optional.of(job(1L, 10L, 1, true)));
            when(clusterJobRepository.save(any(ClusterJob.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            ClusterJobDTO result = clusterJobService.updateJob(1L, 10L, new ClusterJobDTO(null, null, 7, false));

            assertThat(result.priority()).isEqualTo(7);
            assertThat(result.enabled()).isFalse();
            assertAudit(OperationType.UPDATE, "1:10");
        }

        @Test
        @DisplayName("throws EntityNotFoundException when job does not exist")
        void jobNotFound() {
            when(clusterNodeRepository.findById(1L)).thenReturn(Optional.of(node(1L)));
            when(clusterJobRepository.findById(new ClusterJobPK(1L, 10L))).thenReturn(Optional.empty());

            assertThatThrownBy(() -> clusterJobService.updateJob(1L, 10L, new ClusterJobDTO(null, null, 1, true)))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("ClusterJob");
        }

        @Test
        @DisplayName("throws ValidationException when clusterTaskId mismatches the path task id")
        void taskIdMismatch() {
            when(clusterNodeRepository.findById(1L)).thenReturn(Optional.of(node(1L)));

            assertThatThrownBy(() -> clusterJobService.updateJob(1L, 10L, new ClusterJobDTO(null, 20L, 1, true)))
                    .isInstanceOf(ValidationException.class);

            verify(clusterJobRepository, never()).save(any());
        }

        @Test
        @DisplayName("throws ValidationException when enabled is null")
        void enabledNull() {
            when(clusterNodeRepository.findById(1L)).thenReturn(Optional.of(node(1L)));

            assertThatThrownBy(() -> clusterJobService.updateJob(1L, 10L, new ClusterJobDTO(null, 10L, 1, null)))
                    .isInstanceOf(ValidationException.class);

            verify(clusterJobRepository, never()).save(any());
        }

        @Test
        @DisplayName("throws ValidationException when priority is negative")
        void negativePriority() {
            when(clusterNodeRepository.findById(1L)).thenReturn(Optional.of(node(1L)));

            assertThatThrownBy(() -> clusterJobService.updateJob(1L, 10L, new ClusterJobDTO(null, 10L, -5, true)))
                    .isInstanceOf(ValidationException.class);

            verify(clusterJobRepository, never()).save(any());
        }
    }

    // =====================================================================
    // deleteJob
    // =====================================================================

    @Nested
    @DisplayName("deleteJob")
    class DeleteJob {

        @Test
        @DisplayName("deletes the job and audits with nodeId:taskId")
        void deletesOk() {
            ClusterJob existing = job(1L, 10L, 1, true);
            when(clusterJobRepository.findById(new ClusterJobPK(1L, 10L))).thenReturn(Optional.of(existing));

            clusterJobService.deleteJob(1L, 10L);

            verify(clusterJobRepository).delete(existing);
            assertAudit(OperationType.DELETE, "1:10");
        }

        @Test
        @DisplayName("throws EntityNotFoundException when job does not exist")
        void jobNotFound() {
            when(clusterJobRepository.findById(new ClusterJobPK(1L, 10L))).thenReturn(Optional.empty());

            assertThatThrownBy(() -> clusterJobService.deleteJob(1L, 10L))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("ClusterJob");

            verify(clusterJobRepository, never()).delete(any());
            verify(auditService, never()).log(any());
        }
    }

    // =====================================================================
    // findAllTasks
    // =====================================================================

    @Nested
    @DisplayName("findAllTasks")
    class FindAllTasks {

        @Test
        @DisplayName("returns all tasks as DTOs")
        void returnsTasks() {
            when(clusterTaskRepository.findAll()).thenReturn(List.of(task(10L), task(20L)));

            List<ClusterTaskDTO> result = clusterJobService.findAllTasks();

            assertThat(result).hasSize(2);
            assertThat(result.get(0).id()).isEqualTo(10L);
            assertThat(result.get(0).name()).isEqualTo("TASK-10");
        }
    }

    // =====================================================================
    // Helpers
    // =====================================================================

    private void assertAudit(OperationType operationType, String entityId) {
        ArgumentCaptor<AuditLogEntry> captor = ArgumentCaptor.forClass(AuditLogEntry.class);
        verify(auditService).log(captor.capture());
        AuditLogEntry entry = captor.getValue();
        assertThat(entry.operationType()).isEqualTo(operationType);
        assertThat(entry.section()).isEqualTo(AuditSection.CLUSTER);
        assertThat(entry.entityId()).isEqualTo(entityId);
        assertThat(entry.entityName()).isEqualTo("ClusterJob");
    }

    private ClusterNode node(Long id) {
        ClusterNode node = new ClusterNode();
        node.setId(id);
        node.setHostname("host-" + id);
        node.setStatus(NodeStatus.ACTIVE);
        node.setMaster(false);
        return node;
    }

    private ClusterTask task(Long id) {
        ClusterTask task = new ClusterTask();
        task.setId(id);
        task.setName("TASK-" + id);
        task.setDescription("desc-" + id);
        task.setNodes(1);
        task.setMinNodes(1);
        return task;
    }

    private ClusterJob job(Long nodeId, Long taskId, Integer priority, Boolean enabled) {
        ClusterJob job = new ClusterJob();
        job.setId(new ClusterJobPK(nodeId, taskId));
        job.setPriority(priority);
        job.setEnabled(enabled);
        return job;
    }
}
