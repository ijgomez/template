package org.myorganization.template.domain.criteria;

import java.time.OffsetDateTime;

import org.myorganization.template.domain.enums.AuditSection;
import org.myorganization.template.domain.enums.OperationType;

/**
 * Filter criteria for AuditLog listings.
 *
 * @param fromDate      filter start instant in UTC (inclusive)
 * @param toDate        filter end instant in UTC (exclusive)
 * @param username      filter by username
 * @param operationType filter by operation type
 * @param section       filter by audit section
 */
public record AuditCriteria(
        OffsetDateTime fromDate,
        OffsetDateTime toDate,
        String username,
        OperationType operationType,
        AuditSection section
) {
}
