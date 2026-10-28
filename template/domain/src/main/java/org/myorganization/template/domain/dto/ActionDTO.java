package org.myorganization.template.domain.dto;

import java.time.OffsetDateTime;

import org.myorganization.template.domain.enums.ActionType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Data Transfer Object for Action entity.
 *
 * @param id              action identifier ({@code null} for creation)
 * @param code            action code
 * @param type            action type
 * @param name            action name
 * @param description     action description
 * @param createdAt       creation timestamp
 * @param lastModifiedAt  last modification timestamp
 */
public record ActionDTO(
        Long id,
        @Size(max = 100, message = "code must not exceed 100 characters")
        String code,
        @NotNull(message = "type is required")
        ActionType type,
        @NotBlank(message = "name is required")
        @Size(max = 100, message = "name must not exceed 100 characters")
        String name,
        @Size(max = 255, message = "description must not exceed 255 characters")
        String description,
        OffsetDateTime createdAt,
        OffsetDateTime lastModifiedAt
) {
}
