package org.myorganization.template.webapp.controller;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.myorganization.template.core.service.ClusterService;
import org.myorganization.template.domain.criteria.ClusterBlockCriteria;
import org.myorganization.template.domain.dto.ClusterBlockDTO;
import org.myorganization.template.domain.dto.ClusterNodeDTO;
import org.myorganization.template.domain.enums.NodeStatus;
import org.myorganization.template.domain.exception.EntityNotFoundException;
import org.myorganization.template.domain.exception.MethodNotAllowedException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link ClusterController}.
 */
class ClusterControllerTest {

    private ClusterService clusterService;
    private ClusterController clusterController;

    @BeforeEach
    void setUp() {
        clusterService = mock(ClusterService.class);
        clusterController = new ClusterController(clusterService);
    }

    // =====================================================================
    // Node endpoint tests
    // =====================================================================

    @Test
    void findAllNodes_shouldReturnListOfNodes() {
        ClusterNodeDTO node = sampleNode(1L, true);
        when(clusterService.findAllNodes()).thenReturn(List.of(node));

        ResponseEntity<List<ClusterNodeDTO>> response = clusterController.findAllNodes();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody()).hasSize(1);
        assertThat(response.getBody().getFirst().hostname()).isEqualTo("node-1");
    }

    @Test
    void findAllNodes_empty_shouldReturnEmptyList() {
        when(clusterService.findAllNodes()).thenReturn(List.of());

        ResponseEntity<List<ClusterNodeDTO>> response = clusterController.findAllNodes();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody()).isEmpty();
    }

    @Test
    void findNodeById_shouldReturnNode() {
        ClusterNodeDTO node = sampleNode(1L, true);
        when(clusterService.findNodeById(1L)).thenReturn(node);

        ResponseEntity<ClusterNodeDTO> response = clusterController.findNodeById(1L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().id()).isEqualTo(1L);
        assertThat(response.getBody().master()).isTrue();
    }

    @Test
    void findNodeById_notFound_shouldThrowEntityNotFoundException() {
        when(clusterService.findNodeById(99L)).thenThrow(new EntityNotFoundException("ClusterNode", 99L));

        assertThatThrownBy(() -> clusterController.findNodeById(99L))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void updateMaster_shouldReturnUpdatedNode() {
        ClusterNodeDTO updated = sampleNode(1L, true);
        when(clusterService.setMaster(1L)).thenReturn(updated);

        SetMasterRequest request = new SetMasterRequest(true);
        ResponseEntity<ClusterNodeDTO> response = clusterController.updateMaster(1L, request);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().master()).isTrue();
        verify(clusterService).setMaster(1L);
    }

    @Test
    void updateMaster_notFound_shouldThrowEntityNotFoundException() {
        when(clusterService.setMaster(99L)).thenThrow(new EntityNotFoundException("ClusterNode", 99L));

        SetMasterRequest request = new SetMasterRequest(true);
        assertThatThrownBy(() -> clusterController.updateMaster(99L, request))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void createNode_shouldThrowMethodNotAllowedException() {
        ClusterNodeDTO dto = sampleNode(null, false);
        when(clusterService.createNode(dto)).thenThrow(
                new MethodNotAllowedException("Cluster node creation is not allowed. Nodes are auto-registered by the system."));

        assertThatThrownBy(() -> clusterController.createNode(dto))
                .isInstanceOf(MethodNotAllowedException.class)
                .hasMessageContaining("not allowed");
    }

    @Test
    void deleteNode_shouldThrowMethodNotAllowedException() {
        doThrow(new MethodNotAllowedException("Cluster node deletion is not allowed."))
                .when(clusterService).deleteNode(1L);

        assertThatThrownBy(() -> clusterController.deleteNode(1L))
                .isInstanceOf(MethodNotAllowedException.class)
                .hasMessageContaining("not allowed");
    }

    // =====================================================================
    // Block endpoint tests
    // =====================================================================

    @Test
    void findAllBlocks_shouldReturnPageOfBlocks() {
        Pageable pageable = PageRequest.of(0, 10);
        ClusterBlockDTO block = sampleBlock(1L);
        Page<ClusterBlockDTO> page = new PageImpl<>(List.of(block), pageable, 1);
        when(clusterService.findBlocksByCriteria(any(ClusterBlockCriteria.class), eq(pageable))).thenReturn(page);

        ResponseEntity<Page<ClusterBlockDTO>> response = clusterController.findAllBlocks(null, pageable);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getContent()).hasSize(1);
        assertThat(response.getBody().getContent().getFirst().name()).isEqualTo("HEARTBEAT");
    }

    @Test
    void findAllBlocks_withNameFilter_shouldPassCriteriaToService() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<ClusterBlockDTO> page = new PageImpl<>(List.of(), pageable, 0);
        when(clusterService.findBlocksByCriteria(any(ClusterBlockCriteria.class), eq(pageable))).thenReturn(page);

        ResponseEntity<Page<ClusterBlockDTO>> response = clusterController.findAllBlocks("HEART", pageable);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(clusterService).findBlocksByCriteria(any(ClusterBlockCriteria.class), eq(pageable));
    }

    @Test
    void countBlocks_shouldReturnTotalCount() {
        when(clusterService.countBlocksByCriteria(any(ClusterBlockCriteria.class))).thenReturn(5L);

        ResponseEntity<Long> response = clusterController.countBlocks(null);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isEqualTo(5L);
    }

    @Test
    void countBlocks_withNameFilter_shouldPassCriteriaToService() {
        when(clusterService.countBlocksByCriteria(any(ClusterBlockCriteria.class))).thenReturn(2L);

        ResponseEntity<Long> response = clusterController.countBlocks("HEART");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isEqualTo(2L);
    }

    @Test
    void findBlockById_shouldReturnBlock() {
        ClusterBlockDTO block = sampleBlock(1L);
        when(clusterService.findBlockById(1L)).thenReturn(block);

        ResponseEntity<ClusterBlockDTO> response = clusterController.findBlockById(1L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().id()).isEqualTo(1L);
        assertThat(response.getBody().name()).isEqualTo("HEARTBEAT");
    }

    @Test
    void findBlockById_notFound_shouldThrowEntityNotFoundException() {
        when(clusterService.findBlockById(99L)).thenThrow(new EntityNotFoundException("ClusterBlock", 99L));

        assertThatThrownBy(() -> clusterController.findBlockById(99L))
                .isInstanceOf(EntityNotFoundException.class);
    }

    // =====================================================================
    // Helpers
    // =====================================================================

    private ClusterNodeDTO sampleNode(Long id, boolean master) {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        return new ClusterNodeDTO(
                id,
                NodeStatus.ALIVE,
                "node-1",
                "192.168.1.100",
                master,
                1024L * 1024 * 256,
                1024L * 1024 * 768,
                1024L * 1024 * 1024,
                now,
                now
        );
    }

    private ClusterBlockDTO sampleBlock(Long id) {
        return new ClusterBlockDTO(
                id,
                "HEARTBEAT",
                OffsetDateTime.now(ZoneOffset.UTC),
                150L,
                50L,
                300L,
                1000L
        );
    }

}
