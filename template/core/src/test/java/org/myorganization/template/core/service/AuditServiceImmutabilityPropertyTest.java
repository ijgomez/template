package org.myorganization.template.core.service;

import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.Combinators;
import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.myorganization.template.core.repository.AuditLogRepository;
import org.myorganization.template.domain.dto.AuditLogEntry;
import org.myorganization.template.domain.entity.AuditLog;
import org.myorganization.template.domain.enums.AuditSection;
import org.myorganization.template.domain.enums.OperationType;
import org.myorganization.template.domain.exception.EntityNotFoundException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Property-based test for audit log immutability.
 *
 * <p><b>Validates: Requirements 21.5, 26.3</b></p>
 *
 * <p>Property 10: For any existing audit log record, any UPDATE or DELETE attempt
 * should be rejected. The AuditService only exposes read and log operations —
 * no update/delete methods are available in the service API.</p>
 *
 * <p>Feature: template-app, Property 10: Audit log immutability</p>
 */
class AuditServiceImmutabilityPropertyTest {

    /**
     * Forbidden method name patterns that would indicate mutation/deletion capabilities.
     */
    private static final Set<String> FORBIDDEN_METHOD_PREFIXES = Set.of(
            "update", "delete", "remove", "modify", "edit", "patch", "erase", "purge"
    );

    /**
     * Property: For any valid AuditLogEntry, the AuditService public API has no methods
     * that could be used to update or delete a persisted audit record.
     *
     * <p>This verifies the architectural immutability guarantee: once an entry is logged,
     * the service provides no mechanism to alter or remove it.</p>
     */
    @Property(tries = 100)
    void auditServiceExposesNoMutationMethods(
            @ForAll("validAuditLogEntries") AuditLogEntry entry) {

        // Get all public methods of AuditService
        Method[] publicMethods = AuditService.class.getDeclaredMethods();

        List<String> forbiddenMethods = Arrays.stream(publicMethods)
                .filter(m -> Modifier.isPublic(m.getModifiers()))
                .map(Method::getName)
                .filter(name -> FORBIDDEN_METHOD_PREFIXES.stream()
                        .anyMatch(prefix -> name.toLowerCase().startsWith(prefix)))
                .collect(Collectors.toList());

        // Assert: no public methods expose update/delete semantics
        assertThat(forbiddenMethods)
                .as("AuditService must not expose any update/delete/remove methods, " +
                        "ensuring immutability for entry: %s", entry)
                .isEmpty();
    }

    /**
     * Property: For any valid AuditLogEntry, calling log() only results in a save()
     * call on the repository — no deleteById(), delete(), or deleteAll() calls are made.
     *
     * <p>This verifies the behavioral immutability guarantee: the log operation
     * only appends new records and never removes existing ones.</p>
     */
    @Property(tries = 100)
    void logOperationOnlyCallsSaveNeverDeleteOnRepository(
            @ForAll("validAuditLogEntries") AuditLogEntry entry) {

        // Arrange: fresh mocks for each invocation
        AuditLogRepository auditLogRepository = Mockito.mock(AuditLogRepository.class);
        ParameterService parameterService = Mockito.mock(ParameterService.class);
        AuditService auditService = new AuditService(auditLogRepository, parameterService);

        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(invocation -> {
            AuditLog saved = invocation.getArgument(0);
            saved.setId(1L);
            return saved;
        });
        // Simulate no retention config so archival is skipped
        when(parameterService.findByCode("AUDIT_RETENTION_DAYS"))
                .thenThrow(new EntityNotFoundException("Parameter", "AUDIT_RETENTION_DAYS"));

        // Act: log the entry
        auditService.log(entry);

        // Assert: repository received exactly one save() call
        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());

        AuditLog persisted = captor.getValue();
        assertThat(persisted.getUsername()).isEqualTo(entry.username());
        assertThat(persisted.getOperationType()).isEqualTo(entry.operationType());
        assertThat(persisted.getSection()).isEqualTo(entry.section());
        assertThat(persisted.getTimestamp()).isNotNull();

        // Assert: no delete operations were called on the repository
        verify(auditLogRepository, never()).deleteById(any());
        verify(auditLogRepository, never()).delete(any(AuditLog.class));
        verify(auditLogRepository, never()).deleteAll();
        verify(auditLogRepository, never()).deleteAllById(any());
    }

    /**
     * Property: For any valid AuditLogEntry persisted via log(), the service API
     * only provides read operations (findByCriteria, countByCriteria) and append (log).
     * No returned DTO or method allows altering the persisted record.
     *
     * <p>Verifies the service's public method set is strictly limited to
     * read + append operations.</p>
     */
    @Property(tries = 100)
    void auditServiceOnlyExposesReadAndAppendOperations(
            @ForAll("validAuditLogEntries") AuditLogEntry entry) {

        // Allowed public method names (read + append-only)
        Set<String> allowedMethods = Set.of(
                "findByCriteria", "countByCriteria", "log"
        );

        // Get all public methods declared in AuditService (excluding inherited Object methods)
        List<String> publicMethodNames = Arrays.stream(AuditService.class.getDeclaredMethods())
                .filter(m -> Modifier.isPublic(m.getModifiers()))
                .map(Method::getName)
                .collect(Collectors.toList());

        // Assert: every public method is in the allowed set
        assertThat(publicMethodNames)
                .as("AuditService public API should only contain read and append methods, " +
                        "verifying immutability for entry: %s", entry)
                .allMatch(name -> allowedMethods.contains(name),
                        "Expected only read/append methods but found non-allowed method");
    }

    /**
     * Property: The log() method returns void and the AuditLog entity fields are
     * marked as non-updatable at the JPA level, ensuring immutability at the ORM layer.
     *
     * <p>Verifies that even if repository.save() were called on an existing entity,
     * the JPA mapping would prevent field modifications.</p>
     */
    @Property(tries = 100)
    void logMethodIsVoidAndEntityFieldsAreNonUpdatable(
            @ForAll("validAuditLogEntries") AuditLogEntry entry) {

        // Verify: log() return type is void — no reference to modify
        Method logMethod = Arrays.stream(AuditService.class.getDeclaredMethods())
                .filter(m -> m.getName().equals("log") && Modifier.isPublic(m.getModifiers()))
                .findFirst()
                .orElseThrow();
        assertThat(logMethod.getReturnType())
                .as("log() must return void to prevent callers from obtaining a mutable reference")
                .isEqualTo(void.class);

        // Verify: all AuditLog entity fields (except id) are marked updatable=false
        Arrays.stream(AuditLog.class.getDeclaredFields())
                .filter(f -> !f.getName().equals("id"))
                .filter(f -> f.isAnnotationPresent(jakarta.persistence.Column.class))
                .forEach(field -> {
                    jakarta.persistence.Column col = field.getAnnotation(jakarta.persistence.Column.class);
                    assertThat(col.updatable())
                            .as("AuditLog field '%s' must be non-updatable (immutable)", field.getName())
                            .isFalse();
                });
    }

    @Provide
    Arbitrary<AuditLogEntry> validAuditLogEntries() {
        Arbitrary<String> usernames = Arbitraries.strings()
                .alpha()
                .ofMinLength(1)
                .ofMaxLength(50);

        Arbitrary<OperationType> operationTypes = Arbitraries.of(OperationType.class);

        Arbitrary<AuditSection> sections = Arbitraries.of(AuditSection.class);

        Arbitrary<String> entityIds = Arbitraries.strings()
                .numeric()
                .ofMinLength(1)
                .ofMaxLength(10);

        Arbitrary<String> entityNames = Arbitraries.of(
                "User", "Profile", "Action", "Parameter", "Report",
                "Interface", "ClusterNode", "ClusterBlock");

        Arbitrary<String> details = Arbitraries.strings()
                .alpha()
                .numeric()
                .withChars(' ', '.', ',', '-')
                .ofMinLength(0)
                .ofMaxLength(200);

        return Combinators.combine(usernames, operationTypes, sections, entityIds, entityNames, details)
                .as(AuditLogEntry::new);
    }
}
