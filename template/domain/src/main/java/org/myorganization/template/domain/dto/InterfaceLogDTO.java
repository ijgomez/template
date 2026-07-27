package org.myorganization.template.domain.dto;

import java.time.OffsetDateTime;

import org.myorganization.template.domain.enums.InterfaceLogStatus;
import org.myorganization.template.domain.enums.InterfaceOperationType;

/**
 * Data Transfer Object for InterfaceLog entity.
 *
 * @param id              interface log identifier
 * @param timestamp       event timestamp
 * @param operationType   type of interface operation
 * @param interfaceName   name of the interface
 * @param requestPayload  request payload sent
 * @param responsePayload response payload received
 * @param status          log entry status
 */
public record InterfaceLogDTO(
        Long id,
        OffsetDateTime timestamp,
        InterfaceOperationType operationType,
        String interfaceName,
        String requestPayload,
        String responsePayload,
        InterfaceLogStatus status
) {
}
