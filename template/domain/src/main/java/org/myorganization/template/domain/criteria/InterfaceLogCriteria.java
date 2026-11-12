package org.myorganization.template.domain.criteria;

import java.time.OffsetDateTime;

import org.myorganization.template.domain.enums.InterfaceLogStatus;
import org.myorganization.template.domain.enums.InterfaceOperationType;

/**
 * Filter criteria for InterfaceLog listings.
 *
 * @param fromDate      filter start instant in UTC (inclusive)
 * @param toDate        filter end instant in UTC (exclusive)
 * @param operationType filter by interface operation type
 * @param interfaceName filter by interface name
 * @param status        filter by log status
 */
public record InterfaceLogCriteria(
        OffsetDateTime fromDate,
        OffsetDateTime toDate,
        InterfaceOperationType operationType,
        String interfaceName,
        InterfaceLogStatus status
) {
}
