package org.myorganization.template.domain.dto;

import java.time.OffsetDateTime;

import org.myorganization.template.domain.enums.ParameterType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

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
        @NotBlank(message = "code is required")
        @Size(max = 100, message = "code must not exceed 100 characters")
        String code,
        @Size(max = 255, message = "description must not exceed 255 characters")
        String description,
        @NotBlank(message = "value is required")
        @Size(max = 1000, message = "value must not exceed 1000 characters")
        String value,
        @NotNull(message = "type is required")
        ParameterType type,
        OffsetDateTime createdAt,
        OffsetDateTime lastModifiedAt
) {
}
