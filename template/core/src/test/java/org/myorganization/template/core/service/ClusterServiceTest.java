package org.myorganization.template.core.service;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
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
import org.myorganization.template.core.repository.ClusterBlockRepository;
import org.myorganization.template.core.repository.ClusterNodeRepository;
import org.myorganization.template.domain.criteria.ClusterBlockCriteria;
import org.myorganization.template.domain.dto.ClusterBlockDTO;
import org.myorganization.template.domain.dto.ClusterNodeDTO;
import org.myorganization.template.domain.entity.ClusterBlock;
import org.myorganization.template.domain.entity.ClusterNode;
import org.myorganization.template.domain.enums.NodeStatus;
import org.myorganization.template.domain.exception.EntityNotFoundException;
import org.myorganization.template.domain.exception.MethodNotAllowedException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClusterServiceTest {

    @Mock
    private ClusterNodeRepository clusterNodeRepository;

    @Mock
    private ClusterBlockRepository clusterBlockRepository;

    @Mock
    private AuditService auditService;

    private ClusterService clusterService;

    @BeforeEach
    void setUp() {
        clusterService = new ClusterService(clusterNodeRepository, clusterBlockRepository, auditService);
    }

    // =====================================================================
    // Node operations
    // =====================================================================

    @Nested
    @DisplayName("findAllNodes")
    class FindAllNodes {

        @Test
        @DisplayName("returns all nodes as DTOs")
        void returnsAllNodesAsDTOs() {
            ClusterNode node1 = createNode(1L, "host1", NodeStatus.ACTIVE, true);
            ClusterNode node2 = createNode(2L, "host2", NodeStatus.INACTIVE, false);

            when(clusterNodeRepository.findAll()).thenReturn(List.of(node1, node2));

            List<ClusterNodeDTO> result = clusterService.findAllNodes();

            assertThat(result).hasSize(2);
            assertThat(result.get(0).id()).isEqualTo(1L);
            assertThat(result.get(0).hostname()).isEqualTo("host1");
            assertThat(result.get(0).status()).isEqualTo(NodeStatus.ACTIVE);
            assertThat(result.get(0).master()).isTrue();
            assertThat(result.get(1).id()).isEqualTo(2L);
            assertThat(result.get(1).hostname()).isEqualTo("host2");
            assertThat(result.get(1).status()).isEqualTo(NodeStatus.INACTIVE);
        }

        @Test
        @DisplayName("returns empty list when no nodes exist")
        void returnsEmptyListWhenNoNodes() {
            when(clusterNodeRepository.findAll()).thenReturn(List.of());

            List<ClusterNodeDTO> result = clusterService.findAllNodes();

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("findNodeById")
    class FindNodeById {

        @Test
        @DisplayName("existing node returns ClusterNodeDTO")
        void existingNodeReturnsDTO() {
            ClusterNode node = createNode(1L, "host1", NodeStatus.ACTIVE, true);
            when(clusterNodeRepository.findById(1L)).thenReturn(Optional.of(node));

            ClusterNodeDTO result = clusterService.findNodeById(1L);

            assertThat(result.id()).isEqualTo(1L);
            assertThat(result.hostname()).isEqualTo("host1");
            assertThat(result.status()).isEqualTo(NodeStatus.ACTIVE);
            assertThat(result.master()).isTrue();
        }

        @Test
        @DisplayName("non-existing node throws EntityNotFoundException")
        void nonExistingNodeThrowsException() {
            when(clusterNodeRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> clusterService.findNodeById(999L))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("ClusterNode")
                    .hasMessageContaining("999");
        }
    }

    @Nested
    @DisplayName("setMaster")
    class SetMaster {

        @Test
        @DisplayName("deactivates all masters and sets target as master")
        void deactivatesAllMastersAndSetsTarget() {
            ClusterNode node = createNode(2L, "host2", NodeStatus.ACTIVE, false);
            when(clusterNodeRepository.findById(2L)).thenReturn(Optional.of(node));
            when(clusterNodeRepository.save(any(ClusterNode.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            ClusterNodeDTO result = clusterService.setMaster(2L);

            verify(clusterNodeRepository).deactivateAllMasters();
            assertThat(result.master()).isTrue();
            assertThat(result.id()).isEqualTo(2L);
        }

        @Test
        @DisplayName("throws EntityNotFoundException when node does not exist")
        void throwsExceptionWhenNodeNotFound() {
            when(clusterNodeRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> clusterService.setMaster(999L))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("ClusterNode")
                    .hasMessageContaining("999");

            verify(clusterNodeRepository, never()).deactivateAllMasters();
        }
    }

    @Nested
    @DisplayName("detectDeadNodes")
    class DetectDeadNodes {

        @Test
        @DisplayName("marks nodes with old lastModifiedAt as INACTIVE")
        void marksOldNodesAsInactive() {
            ClusterNode staleNode = createNode(1L, "host1", NodeStatus.ACTIVE, false);
            staleNode.setLastModifiedAt(OffsetDateTime.now(ZoneOffset.UTC).minusMinutes(10));

            when(clusterNodeRepository.findByStatusAndLastModifiedAtBefore(
                    eq(NodeStatus.ACTIVE), any(OffsetDateTime.class)))
                    .thenReturn(List.of(staleNode));
            when(clusterNodeRepository.save(any(ClusterNode.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            clusterService.detectDeadNodes();

            ArgumentCaptor<ClusterNode> captor = ArgumentCaptor.forClass(ClusterNode.class);
            verify(clusterNodeRepository).save(captor.capture());
            assertThat(captor.getValue().getStatus()).isEqualTo(NodeStatus.INACTIVE);
        }

        @Test
        @DisplayName("does nothing when no stale nodes found")
        void doesNothingWhenNoStaleNodes() {
            when(clusterNodeRepository.findByStatusAndLastModifiedAtBefore(
                    eq(NodeStatus.ACTIVE), any(OffsetDateTime.class)))
                    .thenReturn(List.of());

            clusterService.detectDeadNodes();

            verify(clusterNodeRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("electMaster")
    class ElectMaster {

        @Test
        @DisplayName("elects first ACTIVE node when no master exists")
        void electsFirstActiveNodeWhenNoMaster() {
            ClusterNode candidate = createNode(1L, "host1", NodeStatus.ACTIVE, false);

            when(clusterNodeRepository.findByMasterTrueAndStatus(NodeStatus.ACTIVE))
                    .thenReturn(Optional.empty());
            when(clusterNodeRepository.findFirstByStatusOrderByIdAsc(NodeStatus.ACTIVE))
                    .thenReturn(Optional.of(candidate));
            when(clusterNodeRepository.save(any(ClusterNode.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            clusterService.electMaster();

            verify(clusterNodeRepository).deactivateAllMasters();
            ArgumentCaptor<ClusterNode> captor = ArgumentCaptor.forClass(ClusterNode.class);
            verify(clusterNodeRepository).save(captor.capture());
            assertThat(captor.getValue().getMaster()).isTrue();
        }

        @Test
        @DisplayName("does nothing when an ACTIVE master already exists")
        void doesNothingWhenMasterExists() {
            ClusterNode master = createNode(1L, "host1", NodeStatus.ACTIVE, true);

            when(clusterNodeRepository.findByMasterTrueAndStatus(NodeStatus.ACTIVE))
                    .thenReturn(Optional.of(master));

            clusterService.electMaster();

            verify(clusterNodeRepository, never()).deactivateAllMasters();
            verify(clusterNodeRepository, never()).save(any());
        }

        @Test
        @DisplayName("does nothing when no ACTIVE nodes available")
        void doesNothingWhenNoActiveNodes() {
            when(clusterNodeRepository.findByMasterTrueAndStatus(NodeStatus.ACTIVE))
                    .thenReturn(Optional.empty());
            when(clusterNodeRepository.findFirstByStatusOrderByIdAsc(NodeStatus.ACTIVE))
                    .thenReturn(Optional.empty());

            clusterService.electMaster();

            verify(clusterNodeRepository, never()).deactivateAllMasters();
            verify(clusterNodeRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Node method restrictions")
    class NodeMethodRestrictions {

        @Test
        @DisplayName("createNode throws MethodNotAllowedException")
        void createNodeThrowsMethodNotAllowed() {
            assertThatThrownBy(() -> clusterService.createNode(null))
                    .isInstanceOf(MethodNotAllowedException.class)
                    .hasMessageContaining("creation is not allowed");
        }

        @Test
        @DisplayName("deleteNode throws MethodNotAllowedException")
        void deleteNodeThrowsMethodNotAllowed() {
            assertThatThrownBy(() -> clusterService.deleteNode(1L))
                    .isInstanceOf(MethodNotAllowedException.class)
                    .hasMessageContaining("deletion is not allowed");
        }
    }

    // =====================================================================
    // Block operations
    // =====================================================================

    @Nested
    @DisplayName("findBlocksByCriteria")
    class FindBlocksByCriteria {

        @Test
        @DisplayName("returns paginated results")
        @SuppressWarnings("unchecked")
        void returnsPaginatedResults() {
            ClusterBlock block = createBlock(1L, "NODOS", 150L, 100L, 200L, 10L);
            Page<ClusterBlock> page = new PageImpl<>(List.of(block), PageRequest.of(0, 10), 1);
            ClusterBlockCriteria criteria = new ClusterBlockCriteria(null);
            Pageable pageable = PageRequest.of(0, 10);

            when(clusterBlockRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(page);

            Page<ClusterBlockDTO> result = clusterService.findBlocksByCriteria(criteria, pageable);

            assertThat(result.getTotalElements()).isEqualTo(1);
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).name()).isEqualTo("NODOS");
        }
    }

    @Nested
    @DisplayName("countBlocksByCriteria")
    class CountBlocksByCriteria {

        @Test
        @DisplayName("returns total count matching criteria")
        @SuppressWarnings("unchecked")
        void returnsCount() {
            ClusterBlockCriteria criteria = new ClusterBlockCriteria("NODOS");
            when(clusterBlockRepository.count(any(Specification.class))).thenReturn(3L);

            long count = clusterService.countBlocksByCriteria(criteria);

            assertThat(count).isEqualTo(3L);
        }
    }

    @Nested
    @DisplayName("findBlockById")
    class FindBlockById {

        @Test
        @DisplayName("existing block returns ClusterBlockDTO")
        void existingBlockReturnsDTO() {
            ClusterBlock block = createBlock(1L, "NODOS", 150L, 100L, 200L, 10L);
            when(clusterBlockRepository.findById(1L)).thenReturn(Optional.of(block));

            ClusterBlockDTO result = clusterService.findBlockById(1L);

            assertThat(result.id()).isEqualTo(1L);
            assertThat(result.name()).isEqualTo("NODOS");
            assertThat(result.avgTime()).isEqualTo(150L);
            assertThat(result.minTime()).isEqualTo(100L);
            assertThat(result.maxTime()).isEqualTo(200L);
            assertThat(result.total()).isEqualTo(10L);
        }

        @Test
        @DisplayName("non-existing block throws EntityNotFoundException")
        void nonExistingBlockThrowsException() {
            when(clusterBlockRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> clusterService.findBlockById(999L))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("ClusterBlock")
                    .hasMessageContaining("999");
        }
    }

    @Nested
    @DisplayName("Block method restrictions")
    class BlockMethodRestrictions {

        @Test
        @DisplayName("createBlock throws MethodNotAllowedException")
        void createBlockThrowsMethodNotAllowed() {
            assertThatThrownBy(() -> clusterService.createBlock(null))
                    .isInstanceOf(MethodNotAllowedException.class)
                    .hasMessageContaining("creation is not allowed");
        }

        @Test
        @DisplayName("updateBlock throws MethodNotAllowedException")
        void updateBlockThrowsMethodNotAllowed() {
            assertThatThrownBy(() -> clusterService.updateBlock(1L, null))
                    .isInstanceOf(MethodNotAllowedException.class)
                    .hasMessageContaining("update is not allowed");
        }

        @Test
        @DisplayName("deleteBlock throws MethodNotAllowedException")
        void deleteBlockThrowsMethodNotAllowed() {
            assertThatThrownBy(() -> clusterService.deleteBlock(1L))
                    .isInstanceOf(MethodNotAllowedException.class)
                    .hasMessageContaining("deletion is not allowed");
        }
    }

    // =====================================================================
    // Helper methods
    // =====================================================================

    private ClusterNode createNode(Long id, String hostname, NodeStatus status, boolean master) {
        ClusterNode node = new ClusterNode();
        node.setId(id);
        node.setHostname(hostname);
        node.setIp("192.168.1." + id);
        node.setStatus(status);
        node.setMaster(master);
        node.setUsedMemory(500_000_000L);
        node.setFreeMemory(300_000_000L);
        node.setTotalMemory(800_000_000L);
        node.setStartedAt(OffsetDateTime.now(ZoneOffset.UTC));
        node.setLastModifiedAt(OffsetDateTime.now(ZoneOffset.UTC));
        return node;
    }

    private ClusterBlock createBlock(Long id, String name, Long avgTime, Long minTime, Long maxTime, Long total) {
        ClusterBlock block = new ClusterBlock();
        block.setId(id);
        block.setName(name);
        block.setStartDate(OffsetDateTime.now(ZoneOffset.UTC));
        block.setAvgTime(avgTime);
        block.setMinTime(minTime);
        block.setMaxTime(maxTime);
        block.setTotal(total);
        return block;
    }
}
