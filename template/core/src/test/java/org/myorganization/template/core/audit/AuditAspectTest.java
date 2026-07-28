package org.myorganization.template.core.audit;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.Signature;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.myorganization.template.core.service.AuditService;
import org.myorganization.template.domain.dto.AuditLogEntry;
import org.myorganization.template.domain.enums.AuditSection;
import org.myorganization.template.domain.enums.OperationType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuditAspectTest {

    @Mock
    private AuditService auditService;

    @Mock
    private JoinPoint joinPoint;

    @Mock
    private Signature signature;

    private AuditAspect auditAspect;

    @BeforeEach
    void setUp() {
        auditAspect = new AuditAspect(auditService);
        lenient().when(joinPoint.getSignature()).thenReturn(signature);
        lenient().when(signature.toShortString()).thenReturn("TestService.method(..)");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Audit log entry is created on successful method execution with correct fields")
    void afterAuditableMethod_successfulExecution_createsAuditLogEntry() {
        // Arrange
        setUpAuthentication("admin.user");
        when(joinPoint.getArgs()).thenReturn(new Object[]{42L});

        Auditable auditable = createAuditable(OperationType.CREATE, AuditSection.SECURITY, "User");
        TestDTO result = new TestDTO(99L, "test-value");

        // Act
        auditAspect.afterAuditableMethod(joinPoint, auditable, result);

        // Assert
        ArgumentCaptor<AuditLogEntry> captor = ArgumentCaptor.forClass(AuditLogEntry.class);
        verify(auditService).log(captor.capture());

        AuditLogEntry entry = captor.getValue();
        assertThat(entry.username()).isEqualTo("admin.user");
        assertThat(entry.operationType()).isEqualTo(OperationType.CREATE);
        assertThat(entry.section()).isEqualTo(AuditSection.SECURITY);
        assertThat(entry.entityId()).isEqualTo("99");
        assertThat(entry.entityName()).isEqualTo("User");
    }

    @Test
    @DisplayName("Audit errors are silently caught and business operations continue")
    void afterAuditableMethod_serviceThrows_doesNotPropagate() {
        // Arrange
        setUpAuthentication("user1");
        when(joinPoint.getArgs()).thenReturn(new Object[]{1L});
        doThrow(new RuntimeException("DB connection failed")).when(auditService).log(any());

        Auditable auditable = createAuditable(OperationType.CREATE, AuditSection.SECURITY, "User");

        // Act & Assert: no exception is thrown
        auditAspect.afterAuditableMethod(joinPoint, auditable, null);

        // Verify that log was attempted
        verify(auditService).log(any(AuditLogEntry.class));
    }

    @Test
    @DisplayName("Username defaults to SYSTEM when no authentication present")
    void afterAuditableMethod_noAuthentication_usesSystemUsername() {
        // Arrange: no security context set
        when(joinPoint.getArgs()).thenReturn(new Object[]{});

        Auditable auditable = createAuditable(OperationType.EXECUTE, AuditSection.REPORTS, "Report");

        // Act
        auditAspect.afterAuditableMethod(joinPoint, auditable, null);

        // Assert
        ArgumentCaptor<AuditLogEntry> captor = ArgumentCaptor.forClass(AuditLogEntry.class);
        verify(auditService).log(captor.capture());

        assertThat(captor.getValue().username()).isEqualTo("SYSTEM");
    }

    @Test
    @DisplayName("Entity ID is extracted from first argument when result has no id")
    void afterAuditableMethod_deleteOperation_extractsIdFromArgs() {
        // Arrange
        setUpAuthentication("admin");
        when(joinPoint.getArgs()).thenReturn(new Object[]{55L});

        Auditable auditable = createAuditable(OperationType.DELETE, AuditSection.SYSTEM, "Parameter");

        // Act
        auditAspect.afterAuditableMethod(joinPoint, auditable, null);

        // Assert
        ArgumentCaptor<AuditLogEntry> captor = ArgumentCaptor.forClass(AuditLogEntry.class);
        verify(auditService).log(captor.capture());

        AuditLogEntry entry = captor.getValue();
        assertThat(entry.entityId()).isEqualTo("55");
        assertThat(entry.detail()).isEqualTo("Deleted entity with id: 55");
    }

    @Test
    @DisplayName("Entity ID is extracted from String argument for code-based entities")
    void afterAuditableMethod_stringArgument_extractsIdFromArgs() {
        // Arrange
        setUpAuthentication("admin");
        when(joinPoint.getArgs()).thenReturn(new Object[]{"PARAM_CODE"});

        Auditable auditable = createAuditable(OperationType.DELETE, AuditSection.SYSTEM, "Parameter");

        // Act
        auditAspect.afterAuditableMethod(joinPoint, auditable, null);

        // Assert
        ArgumentCaptor<AuditLogEntry> captor = ArgumentCaptor.forClass(AuditLogEntry.class);
        verify(auditService).log(captor.capture());

        AuditLogEntry entry = captor.getValue();
        assertThat(entry.entityId()).isEqualTo("PARAM_CODE");
    }

    @Test
    @DisplayName("Detail is null for non-DELETE operations")
    void afterAuditableMethod_createOperation_detailIsNull() {
        // Arrange
        setUpAuthentication("admin");
        when(joinPoint.getArgs()).thenReturn(new Object[]{});

        Auditable auditable = createAuditable(OperationType.CREATE, AuditSection.SECURITY, "Profile");

        // Act
        auditAspect.afterAuditableMethod(joinPoint, auditable, new TestDTO(10L, "name"));

        // Assert
        ArgumentCaptor<AuditLogEntry> captor = ArgumentCaptor.forClass(AuditLogEntry.class);
        verify(auditService).log(captor.capture());

        assertThat(captor.getValue().detail()).isNull();
    }

    // --- Helper methods ---

    private void setUpAuthentication(String username) {
        var authentication = new UsernamePasswordAuthenticationToken(username, null, java.util.Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private Auditable createAuditable(OperationType operationType, AuditSection section, String entityName) {
        return new Auditable() {
            @Override
            public OperationType operationType() {
                return operationType;
            }

            @Override
            public AuditSection section() {
                return section;
            }

            @Override
            public String entityName() {
                return entityName;
            }

            @Override
            public Class<? extends java.lang.annotation.Annotation> annotationType() {
                return Auditable.class;
            }
        };
    }

    /**
     * Test record to simulate a DTO return value with id() method.
     */
    record TestDTO(Long id, String name) {
    }
}
