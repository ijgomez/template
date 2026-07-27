package org.myorganization.template.domain.dto;

import java.time.OffsetDateTime;

import org.myorganization.template.domain.enums.ParameterType;

/**
 * Data Transfer Object for Parameter entity.
 *
 * @param id              parameter identifier ({@code null} for creation)
 * @param code            parameter code
 * @param description     parameter description
 * @param value           parameter value
 * @param type            parameter type
 * @param createdAt       creation timestamp
 * @param lastModifiedAt  last modification timestamp
 */
public record ParameterDTO(
        Long id,
        String code,
        String description,
        String value,
        ParameterType type,
        OffsetDateTime createdAt,
        OffsetDateTime lastModifiedAt
) {
}
