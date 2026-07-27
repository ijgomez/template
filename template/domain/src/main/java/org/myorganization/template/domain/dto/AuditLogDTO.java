package org.myorganization.template.domain.dto;

import java.time.OffsetDateTime;

import org.myorganization.template.domain.enums.AuditSection;
import org.myorganization.template.domain.enums.OperationType;

/**
 * Data Transfer Object for AuditLog entity.
 *
 * @param id             audit log identifier
 * @param timestamp      event timestamp
 * @param username       user who performed the operation
 * @param operationType  type of operation performed
 * @param section        section where the operation occurred
 * @param entityId       identifier of the affected entity
 * @param entityName     name of the affected entity
 * @param detail         additional detail about the operation
 */
public record AuditLogDTO(
        Long id,
        OffsetDateTime timestamp,
        String username,
        OperationType operationType,
        AuditSection section,
        String entityId,
        String entityName,
        String detail
) {
}
