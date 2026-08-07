package org.myorganization.template.core.service;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.myorganization.template.core.repository.InterfaceLogRepository;
import org.myorganization.template.core.repository.InterfaceRepository;
import org.myorganization.template.domain.criteria.InterfaceLogCriteria;
import org.myorganization.template.domain.dto.InterfaceDTO;
import org.myorganization.template.domain.dto.InterfaceLogDTO;
import org.myorganization.template.domain.entity.Interface;
import org.myorganization.template.domain.entity.InterfaceLog;
import org.myorganization.template.domain.enums.InterfaceLogStatus;
import org.myorganization.template.domain.enums.InterfaceOperationType;
import org.myorganization.template.domain.enums.InterfaceStatus;
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
class InterfaceServiceTest {

    @Mock
    private InterfaceRepository interfaceRepository;

    @Mock
    private InterfaceLogRepository interfaceLogRepository;

    private InterfaceService interfaceService;

    @BeforeEach
    void setUp() {
        interfaceService = new InterfaceService(interfaceRepository, interfaceLogRepository);
    }

    // ─── findAll ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("findAll: returns all interfaces as DTOs")
    void findAll_returnsAllInterfaces() {
        Interface iface1 = createInterface(1L, "REST API", "External REST API", "https://api.example.com",
                "REST", InterfaceStatus.ACTIVE, 60);
        Interface iface2 = createInterface(2L, "SOAP Service", "Legacy SOAP service", "https://soap.example.com",
                "SOAP", InterfaceStatus.ERROR, 120);

        when(interfaceRepository.findAll()).thenReturn(List.of(iface1, iface2));

        List<InterfaceDTO> result = interfaceService.findAll();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).name()).isEqualTo("REST API");
        assertThat(result.get(0).status()).isEqualTo(InterfaceStatus.ACTIVE);
        assertThat(result.get(1).name()).isEqualTo("SOAP Service");
        assertThat(result.get(1).status()).isEqualTo(InterfaceStatus.ERROR);
    }

    @Test
    @DisplayName("findAll: returns empty list when no interfaces exist")
    void findAll_emptyList() {
        when(interfaceRepository.findAll()).thenReturn(List.of());

        List<InterfaceDTO> result = interfaceService.findAll();

        assertThat(result).isEmpty();
    }

    // ─── findById ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("findById: existing interface returns InterfaceDTO")
    void findById_existingInterface_returnsDTO() {
        Interface iface = createInterface(1L, "REST API", "External REST API", "https://api.example.com",
                "REST", InterfaceStatus.ACTIVE, 60);

        when(interfaceRepository.findById(1L)).thenReturn(Optional.of(iface));

        InterfaceDTO result = interfaceService.findById(1L);

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.name()).isEqualTo("REST API");
        assertThat(result.description()).isEqualTo("External REST API");
        assertThat(result.url()).isEqualTo("https://api.example.com");
        assertThat(result.protocol()).isEqualTo("REST");
        assertThat(result.status()).isEqualTo(InterfaceStatus.ACTIVE);
        assertThat(result.checkFrequency()).isEqualTo(60);
    }

    @Test
    @DisplayName("findById: non-existing interface throws EntityNotFoundException")
    void findById_nonExistingInterface_throwsEntityNotFoundException() {
        when(interfaceRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> interfaceService.findById(999L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Interface")
                .hasMessageContaining("999");
    }

    // ─── CUD operations (405) ────────────────────────────────────────────────────

    @Test
    @DisplayName("create: always throws MethodNotAllowedException")
    void create_throwsMethodNotAllowedException() {
        InterfaceDTO dto = new InterfaceDTO(null, "New", "desc", "url", "REST",
                InterfaceStatus.ACTIVE, 30, null, null);

        assertThatThrownBy(() -> interfaceService.create(dto))
                .isInstanceOf(MethodNotAllowedException.class)
                .hasMessageContaining("creation is not allowed");

        verify(interfaceRepository, never()).save(any());
    }

    @Test
    @DisplayName("update: always throws MethodNotAllowedException")
    void update_throwsMethodNotAllowedException() {
        InterfaceDTO dto = new InterfaceDTO(1L, "Updated", "desc", "url", "REST",
                InterfaceStatus.ACTIVE, 30, null, null);

        assertThatThrownBy(() -> interfaceService.update(1L, dto))
                .isInstanceOf(MethodNotAllowedException.class)
                .hasMessageContaining("update is not allowed");

        verify(interfaceRepository, never()).save(any());
    }

    @Test
    @DisplayName("delete: always throws MethodNotAllowedException")
    void delete_throwsMethodNotAllowedException() {
        assertThatThrownBy(() -> interfaceService.delete(1L))
                .isInstanceOf(MethodNotAllowedException.class)
                .hasMessageContaining("deletion is not allowed");

        verify(interfaceRepository, never()).delete(any(Interface.class));
        verify(interfaceRepository, never()).deleteById(any());
    }

    // ─── findLogsByCriteria ──────────────────────────────────────────────────────

    @Test
    @DisplayName("findLogsByCriteria: returns paginated results with no filters")
    @SuppressWarnings("unchecked")
    void findLogsByCriteria_noFilters_returnsPaginatedResults() {
        InterfaceLog log = createInterfaceLog(1L, InterfaceOperationType.POST, "REST API",
                "{\"key\":\"value\"}", "{\"result\":\"ok\"}", InterfaceLogStatus.SUCCESS);
        Page<InterfaceLog> page = new PageImpl<>(List.of(log), PageRequest.of(0, 10), 1);
        InterfaceLogCriteria criteria = new InterfaceLogCriteria(null, null, null, null, null);
        Pageable pageable = PageRequest.of(0, 10);

        when(interfaceLogRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(page);

        Page<InterfaceLogDTO> result = interfaceService.findLogsByCriteria(criteria, pageable);

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).interfaceName()).isEqualTo("REST API");
        assertThat(result.getContent().get(0).status()).isEqualTo(InterfaceLogStatus.SUCCESS);
    }

    @Test
    @DisplayName("findLogsByCriteria: applies all filter criteria")
    @SuppressWarnings("unchecked")
    void findLogsByCriteria_withFilters_returnsPaginatedResults() {
        OffsetDateTime from = OffsetDateTime.of(2024, 1, 1, 0, 0, 0, 0, ZoneOffset.UTC);
        OffsetDateTime to = OffsetDateTime.of(2024, 12, 31, 23, 59, 59, 0, ZoneOffset.UTC);
        InterfaceLogCriteria criteria = new InterfaceLogCriteria(from, to,
                InterfaceOperationType.GET, "SOAP", InterfaceLogStatus.ERROR);
        Pageable pageable = PageRequest.of(0, 10);
        Page<InterfaceLog> emptyPage = new PageImpl<>(List.of(), pageable, 0);

        when(interfaceLogRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(emptyPage);

        Page<InterfaceLogDTO> result = interfaceService.findLogsByCriteria(criteria, pageable);

        assertThat(result.getTotalElements()).isZero();
        assertThat(result.getContent()).isEmpty();
    }

    // ─── countLogsByCriteria ─────────────────────────────────────────────────────

    @Test
    @DisplayName("countLogsByCriteria: returns total count matching criteria")
    @SuppressWarnings("unchecked")
    void countLogsByCriteria_returnsCount() {
        InterfaceLogCriteria criteria = new InterfaceLogCriteria(null, null,
                InterfaceOperationType.POST, null, InterfaceLogStatus.SUCCESS);

        when(interfaceLogRepository.count(any(Specification.class))).thenReturn(42L);

        long count = interfaceService.countLogsByCriteria(criteria);

        assertThat(count).isEqualTo(42L);
    }

    // ─── findLogById ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("findLogById: existing log returns InterfaceLogDTO")
    void findLogById_existingLog_returnsDTO() {
        InterfaceLog log = createInterfaceLog(5L, InterfaceOperationType.GET, "Payment Gateway",
                "{\"amount\":100}", "{\"status\":\"approved\"}", InterfaceLogStatus.SUCCESS);

        when(interfaceLogRepository.findById(5L)).thenReturn(Optional.of(log));

        InterfaceLogDTO result = interfaceService.findLogById(5L);

        assertThat(result.id()).isEqualTo(5L);
        assertThat(result.operationType()).isEqualTo(InterfaceOperationType.GET);
        assertThat(result.interfaceName()).isEqualTo("Payment Gateway");
        assertThat(result.requestPayload()).isEqualTo("{\"amount\":100}");
        assertThat(result.responsePayload()).isEqualTo("{\"status\":\"approved\"}");
        assertThat(result.status()).isEqualTo(InterfaceLogStatus.SUCCESS);
    }

    @Test
    @DisplayName("findLogById: non-existing log throws EntityNotFoundException")
    void findLogById_nonExistingLog_throwsEntityNotFoundException() {
        when(interfaceLogRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> interfaceService.findLogById(999L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("InterfaceLog")
                .hasMessageContaining("999");
    }

    // ─── logOperation ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("logOperation: creates a new immutable log entry")
    void logOperation_createsNewLogEntry() {
        when(interfaceLogRepository.save(any(InterfaceLog.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        interfaceService.logOperation(
                InterfaceOperationType.POST,
                "REST API",
                "{\"request\":\"data\"}",
                "{\"response\":\"ok\"}",
                InterfaceLogStatus.SUCCESS
        );

        ArgumentCaptor<InterfaceLog> captor = ArgumentCaptor.forClass(InterfaceLog.class);
        verify(interfaceLogRepository).save(captor.capture());

        InterfaceLog saved = captor.getValue();
        assertThat(saved.getOperationType()).isEqualTo(InterfaceOperationType.POST);
        assertThat(saved.getInterfaceName()).isEqualTo("REST API");
        assertThat(saved.getRequestPayload()).isEqualTo("{\"request\":\"data\"}");
        assertThat(saved.getResponsePayload()).isEqualTo("{\"response\":\"ok\"}");
        assertThat(saved.getStatus()).isEqualTo(InterfaceLogStatus.SUCCESS);
    }

    @Test
    @DisplayName("logOperation: supports null payloads")
    void logOperation_supportsNullPayloads() {
        when(interfaceLogRepository.save(any(InterfaceLog.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        interfaceService.logOperation(
                InterfaceOperationType.GET,
                "Notification Service",
                null,
                null,
                InterfaceLogStatus.ERROR
        );

        ArgumentCaptor<InterfaceLog> captor = ArgumentCaptor.forClass(InterfaceLog.class);
        verify(interfaceLogRepository).save(captor.capture());

        InterfaceLog saved = captor.getValue();
        assertThat(saved.getOperationType()).isEqualTo(InterfaceOperationType.GET);
        assertThat(saved.getInterfaceName()).isEqualTo("Notification Service");
        assertThat(saved.getRequestPayload()).isNull();
        assertThat(saved.getResponsePayload()).isNull();
        assertThat(saved.getStatus()).isEqualTo(InterfaceLogStatus.ERROR);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    private Interface createInterface(Long id, String name, String description, String url,
                                      String protocol, InterfaceStatus status, Integer checkFrequency) {
        Interface iface = new Interface();
        iface.setId(id);
        iface.setName(name);
        iface.setDescription(description);
        iface.setUrl(url);
        iface.setProtocol(protocol);
        iface.setStatus(status);
        iface.setCheckFrequency(checkFrequency);
        iface.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        iface.setLastModifiedAt(OffsetDateTime.now(ZoneOffset.UTC));
        return iface;
    }

    private InterfaceLog createInterfaceLog(Long id, InterfaceOperationType operationType,
                                            String interfaceName, String requestPayload,
                                            String responsePayload, InterfaceLogStatus status) {
        InterfaceLog log = new InterfaceLog();
        log.setId(id);
        log.setOperationType(operationType);
        log.setInterfaceName(interfaceName);
        log.setRequestPayload(requestPayload);
        log.setResponsePayload(responsePayload);
        log.setStatus(status);
        log.setTimestamp(OffsetDateTime.now(ZoneOffset.UTC));
        return log;
    }
}
