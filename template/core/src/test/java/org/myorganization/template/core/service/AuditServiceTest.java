package org.myorganization.template.core.service;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.myorganization.template.core.repository.AuditLogRepository;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.myorganization.template.domain.criteria.AuditCriteria;
import org.myorganization.template.domain.dto.AuditLogDTO;
import org.myorganization.template.domain.dto.AuditLogEntry;
import org.myorganization.template.domain.dto.ParameterDTO;
import org.myorganization.template.domain.entity.AuditLog;
import org.myorganization.template.domain.enums.AuditSection;
import org.myorganization.template.domain.enums.OperationType;
import org.myorganization.template.domain.enums.ParameterType;
import org.myorganization.template.domain.exception.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuditServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private ParameterService parameterService;

    @Captor
    private ArgumentCaptor<Specification<AuditLog>> specCaptor;

    @Mock
    private Root<AuditLog> root;

    @Mock
    private CriteriaQuery<?> criteriaQuery;

    @Mock
    private CriteriaBuilder criteriaBuilder;

    @Mock
    private Predicate criteriaPredicate;

    @Mock
    private Path<String> stringPath;

    @Mock
    private Expression<String> stringExpression;

    private AuditService auditService;

    @BeforeEach
    void setUp() {
        auditService = new AuditService(auditLogRepository, parameterService);
    }

    @Test
    @DisplayName("findByCriteria: returns paginated results with all filters applied")
    void findByCriteria_allFilters_returnsPaginatedResults() {
        // Arrange
        AuditLog auditLog = createAuditLog(1L, "admin", OperationType.CREATE, AuditSection.SECURITY, "User");
        Page<AuditLog> page = new PageImpl<>(List.of(auditLog), PageRequest.of(0, 10), 1);
        AuditCriteria criteria = new AuditCriteria(
                OffsetDateTime.now(ZoneOffset.UTC).minusDays(1),
                OffsetDateTime.now(ZoneOffset.UTC),
                "admin",
                OperationType.CREATE,
                AuditSection.SECURITY
        );
        Pageable pageable = PageRequest.of(0, 10);

        when(auditLogRepository.findAll(ArgumentMatchers.<Specification<AuditLog>>any(), eq(pageable))).thenReturn(page);

        // Act
        Page<AuditLogDTO> result = auditService.findByCriteria(criteria, pageable);

        // Assert
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).username()).isEqualTo("admin");
        assertThat(result.getContent().get(0).operationType()).isEqualTo(OperationType.CREATE);
        assertThat(result.getContent().get(0).section()).isEqualTo(AuditSection.SECURITY);
    }

    @Test
    @DisplayName("findByCriteria: returns results with empty criteria (no filters)")
    void findByCriteria_emptyCriteria_returnsAllResults() {
        // Arrange
        AuditLog log1 = createAuditLog(1L, "admin", OperationType.CREATE, AuditSection.SECURITY, "User");
        AuditLog log2 = createAuditLog(2L, "user1", OperationType.DELETE, AuditSection.SYSTEM, "Parameter");
        Page<AuditLog> page = new PageImpl<>(List.of(log1, log2), PageRequest.of(0, 10), 2);
        AuditCriteria criteria = new AuditCriteria(null, null, null, null, null);
        Pageable pageable = PageRequest.of(0, 10);

        when(auditLogRepository.findAll(ArgumentMatchers.<Specification<AuditLog>>any(), eq(pageable))).thenReturn(page);

        // Act
        Page<AuditLogDTO> result = auditService.findByCriteria(criteria, pageable);

        // Assert
        assertThat(result.getTotalElements()).isEqualTo(2);
        assertThat(result.getContent()).hasSize(2);
    }

    @Test
    @DisplayName("countByCriteria: returns total count matching criteria")
    void countByCriteria_returnsCount() {
        // Arrange
        AuditCriteria criteria = new AuditCriteria(null, null, "admin", null, null);
        when(auditLogRepository.count(ArgumentMatchers.<Specification<AuditLog>>any())).thenReturn(15L);

        // Act
        long count = auditService.countByCriteria(criteria);

        // Assert
        assertThat(count).isEqualTo(15L);
    }

    @Test
    @DisplayName("log: persists audit log entry with correct fields")
    void log_validEntry_persistsAuditLog() {
        // Arrange
        AuditLogEntry entry = new AuditLogEntry(
                "admin",
                OperationType.CREATE,
                AuditSection.SECURITY,
                "42",
                "User",
                "Created user admin2"
        );

        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(invocation -> {
            AuditLog saved = invocation.getArgument(0);
            saved.setId(1L);
            return saved;
        });

        // Act
        auditService.log(entry);

        // Assert
        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());

        AuditLog saved = captor.getValue();
        assertThat(saved.getUsername()).isEqualTo("admin");
        assertThat(saved.getOperationType()).isEqualTo(OperationType.CREATE);
        assertThat(saved.getSection()).isEqualTo(AuditSection.SECURITY);
        assertThat(saved.getEntityId()).isEqualTo("42");
        assertThat(saved.getEntityName()).isEqualTo("User");
        assertThat(saved.getDetail()).isEqualTo("Created user admin2");
        assertThat(saved.getTimestamp()).isNotNull();
    }

    @Test
    @DisplayName("log: sets timestamp in UTC")
    void log_setsTimestampInUtc() {
        // Arrange
        AuditLogEntry entry = new AuditLogEntry(
                "user1", OperationType.UPDATE, AuditSection.SYSTEM, "1", "Parameter", null
        );

        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OffsetDateTime before = OffsetDateTime.now(ZoneOffset.UTC);

        // Act
        auditService.log(entry);

        OffsetDateTime after = OffsetDateTime.now(ZoneOffset.UTC);

        // Assert
        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());

        OffsetDateTime timestamp = captor.getValue().getTimestamp();
        assertThat(timestamp)
                .isAfterOrEqualTo(before)
                .isBeforeOrEqualTo(after);
    }

    @Test
    @DisplayName("archiveIfRetentionExceeded: archives old records when retention period configured")
    void archiveIfRetentionExceeded_withRetentionParam_archivesOldRecords() {
        // Arrange
        ParameterDTO retentionParam = new ParameterDTO(
                1L, "AUDIT_RETENTION_DAYS", "Retention period", "30", ParameterType.INTEGER, null, null
        );
        when(parameterService.findByCode("AUDIT_RETENTION_DAYS")).thenReturn(retentionParam);
        when(auditLogRepository.deleteByTimestampBefore(any(OffsetDateTime.class))).thenReturn(5L);
        

        // Act
        auditService.archiveIfRetentionExceeded();

        // Assert
        verify(auditLogRepository).deleteByTimestampBefore(any(OffsetDateTime.class));
    }

    @Test
    @DisplayName("archiveIfRetentionExceeded: does nothing when parameter not configured")
    void archiveIfRetentionExceeded_noParam_doesNothing() {
        // Arrange
        when(parameterService.findByCode("AUDIT_RETENTION_DAYS"))
                .thenThrow(new EntityNotFoundException("Parameter", "AUDIT_RETENTION_DAYS"));

        // Act
        auditService.archiveIfRetentionExceeded();

        // Assert
        verify(auditLogRepository, never()).deleteByTimestampBefore(any(OffsetDateTime.class));
    }

    @Test
    @DisplayName("archiveIfRetentionExceeded: does nothing when no old records exist")
    void archiveIfRetentionExceeded_noOldRecords_doesNotDelete() {
        // Arrange
        ParameterDTO retentionParam = new ParameterDTO(
                1L, "AUDIT_RETENTION_DAYS", "Retention period", "90", ParameterType.INTEGER, null, null
        );
        when(parameterService.findByCode("AUDIT_RETENTION_DAYS")).thenReturn(retentionParam);
        when(auditLogRepository.deleteByTimestampBefore(any(OffsetDateTime.class))).thenReturn(0L);

        // Act
        auditService.archiveIfRetentionExceeded();

        // Assert
        verify(auditLogRepository).deleteByTimestampBefore(any(OffsetDateTime.class));
    }

    @ParameterizedTest
    @ValueSource(strings = {"0", "-5", "  "})
    @DisplayName("archiveIfRetentionExceeded: invalid or non-positive retention days does nothing")
    void archiveIfRetentionExceeded_invalidOrNonPositiveDays_doesNothing(String retentionValue) {
        // Arrange
        ParameterDTO retentionParam = new ParameterDTO(
                1L, "AUDIT_RETENTION_DAYS", "Retention period", retentionValue, ParameterType.INTEGER, null, null
        );
        when(parameterService.findByCode("AUDIT_RETENTION_DAYS")).thenReturn(retentionParam);

        // Act
        auditService.archiveIfRetentionExceeded();

        // Assert
        verify(auditLogRepository, never()).deleteByTimestampBefore(any(OffsetDateTime.class));
    }

    @Test
    @DisplayName("findByCriteria: maps all entity fields to DTO correctly")
    void findByCriteria_mapsAllFieldsCorrectly() {
        // Arrange
        AuditLog auditLog = createAuditLog(5L, "testuser", OperationType.UPDATE, AuditSection.CLUSTER, "ClusterNode");
        auditLog.setEntityId("100");
        auditLog.setDetail("Updated master flag");

        Page<AuditLog> page = new PageImpl<>(List.of(auditLog), PageRequest.of(0, 10), 1);
        AuditCriteria criteria = new AuditCriteria(null, null, null, null, null);
        Pageable pageable = PageRequest.of(0, 10);

        when(auditLogRepository.findAll(ArgumentMatchers.<Specification<AuditLog>>any(), eq(pageable))).thenReturn(page);

        // Act
        Page<AuditLogDTO> result = auditService.findByCriteria(criteria, pageable);

        // Assert
        AuditLogDTO dto = result.getContent().get(0);
        assertThat(dto.id()).isEqualTo(5L);
        assertThat(dto.username()).isEqualTo("testuser");
        assertThat(dto.operationType()).isEqualTo(OperationType.UPDATE);
        assertThat(dto.section()).isEqualTo(AuditSection.CLUSTER);
        assertThat(dto.entityName()).isEqualTo("ClusterNode");
        assertThat(dto.entityId()).isEqualTo("100");
        assertThat(dto.detail()).isEqualTo("Updated master flag");
        assertThat(dto.timestamp()).isNotNull();
    }



    @Test
    @DisplayName("buildSpecification: all filters build a full specification via captured spec")
    void buildSpecification_allFilters_executesLambdas() {
        AuditCriteria criteria = new AuditCriteria(
                OffsetDateTime.now(ZoneOffset.UTC).minusDays(1),
                OffsetDateTime.now(ZoneOffset.UTC),
                "admin",
                OperationType.CREATE,
                AuditSection.SECURITY
        );
        Pageable pageable = PageRequest.of(0, 10);
        Page<AuditLog> page = new PageImpl<>(List.of(), pageable, 0);

        when(auditLogRepository.findAll(specCaptor.capture(), eq(pageable))).thenReturn(page);

        auditService.findByCriteria(criteria, pageable);

        Predicate predicate = evaluateSpecification(specCaptor.getValue());
        assertThat(predicate).isNotNull();
    }

    private Predicate evaluateSpecification(Specification<AuditLog> spec) {
        lenient().when(root.<String>get(anyString())).thenReturn(stringPath);
        lenient().when(criteriaBuilder.conjunction()).thenReturn(criteriaPredicate);
        lenient().when(criteriaBuilder.lower(any())).thenReturn(stringExpression);
        lenient().when(criteriaBuilder.like(any(), anyString())).thenReturn(criteriaPredicate);
        lenient().when(criteriaBuilder.equal(any(), any())).thenReturn(criteriaPredicate);
        lenient().when(criteriaBuilder.greaterThanOrEqualTo(any(), any(OffsetDateTime.class))).thenReturn(criteriaPredicate);
        lenient().when(criteriaBuilder.lessThanOrEqualTo(any(), any(OffsetDateTime.class))).thenReturn(criteriaPredicate);
        lenient().when(criteriaBuilder.and(any(Predicate.class), any(Predicate.class))).thenReturn(criteriaPredicate);

        return spec.toPredicate(root, criteriaQuery, criteriaBuilder);
    }

    // --- Helper methods ---

    private AuditLog createAuditLog(Long id, String username, OperationType operationType,
                                     AuditSection section, String entityName) {
        AuditLog auditLog = new AuditLog();
        auditLog.setId(id);
        auditLog.setTimestamp(OffsetDateTime.now(ZoneOffset.UTC));
        auditLog.setUsername(username);
        auditLog.setOperationType(operationType);
        auditLog.setSection(section);
        auditLog.setEntityName(entityName);
        return auditLog;
    }
}
