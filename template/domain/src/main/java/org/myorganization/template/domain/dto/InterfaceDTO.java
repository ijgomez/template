package org.myorganization.template.domain.dto;

import java.time.OffsetDateTime;

import org.myorganization.template.domain.enums.InterfaceStatus;

/**
 * Data Transfer Object for Interface entity.
 *
 * @param id              interface identifier ({@code null} for creation)
 * @param name            interface name
 * @param description     interface description
 * @param url             interface URL
 * @param protocol        protocol used
 * @param status          interface status
 * @param checkFrequency  frequency of health checks in seconds
 * @param createdAt       creation timestamp
 * @param lastModifiedAt  last modification timestamp
 */
public record InterfaceDTO(
        Long id,
        String name,
        String description,
        String url,
        String protocol,
        InterfaceStatus status,
        Integer checkFrequency,
        OffsetDateTime createdAt,
        OffsetDateTime lastModifiedAt
) {
}
