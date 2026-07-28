package org.myorganization.template.domain.dto;

import org.myorganization.template.domain.enums.AuditSection;
import org.myorganization.template.domain.enums.OperationType;

/**
 * Internal data carrier for creating audit log entries.
 * <p>
 * Used by the AuditAspect to pass audit information to the AuditService.
 * Not exposed via any API endpoint.
 *
 * @param username      user who performed the operation
 * @param operationType type of operation performed
 * @param section       section where the operation occurred
 * @param entityId      identifier of the affected entity (optional)
 * @param entityName    name/type of the affected entity
 * @param detail        additional detail about the operation (optional)
 */
public record AuditLogEntry(
        String username,
        OperationType operationType,
        AuditSection section,
        String entityId,
        String entityName,
        String detail
) {
}
