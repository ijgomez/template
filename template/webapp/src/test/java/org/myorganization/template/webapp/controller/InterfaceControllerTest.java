package org.myorganization.template.webapp.controller;

import java.time.OffsetDateTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.myorganization.template.core.service.InterfaceService;
import org.myorganization.template.domain.criteria.InterfaceLogCriteria;
import org.myorganization.template.domain.dto.InterfaceDTO;
import org.myorganization.template.domain.dto.InterfaceLogDTO;
import org.myorganization.template.domain.enums.InterfaceLogStatus;
import org.myorganization.template.domain.enums.InterfaceOperationType;
import org.myorganization.template.domain.enums.InterfaceStatus;
import org.myorganization.template.domain.exception.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link InterfaceControllerImpl}.
 */
class InterfaceControllerTest {

    private InterfaceService interfaceService;
    private InterfaceControllerImpl controller;

    @BeforeEach
    void setUp() {
        interfaceService = mock(InterfaceService.class);
        controller = new InterfaceControllerImpl(interfaceService);
    }

    // ─── Configuration endpoints ─────────────────────────────────────────────────

    @Test
    void findAll_shouldReturnListOfInterfaces() {
        InterfaceDTO dto1 = sampleInterface(1L, "REST API");
        InterfaceDTO dto2 = sampleInterface(2L, "SOAP Service");
        when(interfaceService.findAll()).thenReturn(List.of(dto1, dto2));

        ResponseEntity<List<InterfaceDTO>> response = controller.findAll();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).hasSize(2);
        assertThat(response.getBody().get(0).name()).isEqualTo("REST API");
        assertThat(response.getBody().get(1).name()).isEqualTo("SOAP Service");
    }

    @Test
    void findAll_empty_shouldReturnEmptyList() {
        when(interfaceService.findAll()).thenReturn(List.of());

        ResponseEntity<List<InterfaceDTO>> response = controller.findAll();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isEmpty();
    }

    @Test
    void findById_shouldReturnInterface() {
        InterfaceDTO dto = sampleInterface(1L, "REST API");
        when(interfaceService.findById(1L)).thenReturn(dto);

        ResponseEntity<InterfaceDTO> response = controller.findById(1L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().id()).isEqualTo(1L);
        assertThat(response.getBody().name()).isEqualTo("REST API");
    }

    @Test
    void findById_notFound_shouldThrowEntityNotFoundException() {
        when(interfaceService.findById(99L)).thenThrow(new EntityNotFoundException("Interface", 99L));

        assertThatThrownBy(() -> controller.findById(99L))
                .isInstanceOf(EntityNotFoundException.class);
    }

    // ─── Monitor endpoints ───────────────────────────────────────────────────────

    @Test
    void findLogs_shouldReturnPageOfLogs() {
        Pageable pageable = PageRequest.of(0, 10);
        InterfaceLogDTO logDto = sampleLog(1L);
        Page<InterfaceLogDTO> page = new PageImpl<>(List.of(logDto), pageable, 1);
        when(interfaceService.findLogsByCriteria(any(InterfaceLogCriteria.class), eq(pageable))).thenReturn(page);

        ResponseEntity<Page<InterfaceLogDTO>> response = controller.findLogs(0, 10, null, null, null, null, null);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getContent()).hasSize(1);
        assertThat(response.getBody().getContent().getFirst().interfaceName()).isEqualTo("REST API");
    }

    @Test
    void findLogs_withFilters_shouldPassCriteriaToService() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<InterfaceLogDTO> page = new PageImpl<>(List.of(), pageable, 0);
        OffsetDateTime from = OffsetDateTime.now().minusDays(7);
        OffsetDateTime to = OffsetDateTime.now();
        when(interfaceService.findLogsByCriteria(any(InterfaceLogCriteria.class), eq(pageable))).thenReturn(page);

        ResponseEntity<Page<InterfaceLogDTO>> response = controller.findLogs(
                0, 10, from, to, InterfaceOperationType.IN, "REST", InterfaceLogStatus.SUCCESS);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(interfaceService).findLogsByCriteria(any(InterfaceLogCriteria.class), eq(pageable));
    }

    @Test
    void countLogs_shouldReturnTotalCount() {
        when(interfaceService.countLogsByCriteria(any(InterfaceLogCriteria.class))).thenReturn(42L);

        ResponseEntity<Long> response = controller.countLogs(null, null, null, null, null);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isEqualTo(42L);
    }

    @Test
    void countLogs_withFilters_shouldPassCriteriaToService() {
        OffsetDateTime from = OffsetDateTime.now().minusDays(1);
        when(interfaceService.countLogsByCriteria(any(InterfaceLogCriteria.class))).thenReturn(5L);

        ResponseEntity<Long> response = controller.countLogs(
                from, null, InterfaceOperationType.OUT, "SOAP", InterfaceLogStatus.ERROR);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isEqualTo(5L);
        verify(interfaceService).countLogsByCriteria(any(InterfaceLogCriteria.class));
    }

    @Test
    void findLogById_shouldReturnLogDetail() {
        InterfaceLogDTO logDto = sampleLog(1L);
        when(interfaceService.findLogById(1L)).thenReturn(logDto);

        ResponseEntity<InterfaceLogDTO> response = controller.findLogById(1L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().id()).isEqualTo(1L);
        assertThat(response.getBody().operationType()).isEqualTo(InterfaceOperationType.IN);
    }

    @Test
    void findLogById_notFound_shouldThrowEntityNotFoundException() {
        when(interfaceService.findLogById(99L)).thenThrow(new EntityNotFoundException("InterfaceLog", 99L));

        assertThatThrownBy(() -> controller.findLogById(99L))
                .isInstanceOf(EntityNotFoundException.class);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    private InterfaceDTO sampleInterface(Long id, String name) {
        return new InterfaceDTO(id, name, "Description for " + name,
                "https://example.com/api", "REST", InterfaceStatus.ACTIVE, 60,
                OffsetDateTime.now(), OffsetDateTime.now());
    }

    private InterfaceLogDTO sampleLog(Long id) {
        return new InterfaceLogDTO(id, OffsetDateTime.now(),
                InterfaceOperationType.IN, "REST API",
                "{\"key\":\"value\"}", "{\"result\":\"ok\"}",
                InterfaceLogStatus.SUCCESS);
    }

}
