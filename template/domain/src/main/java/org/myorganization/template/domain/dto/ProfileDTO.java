package org.myorganization.template.domain.dto;

import java.time.OffsetDateTime;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Data Transfer Object for Profile entity.
 *
 * @param id              profile identifier ({@code null} for creation)
 * @param name            profile name
 * @param description     profile description
 * @param actionIds       list of associated action identifiers
 * @param createdAt       creation timestamp
 * @param lastModifiedAt  last modification timestamp
 */
public record ProfileDTO(
        Long id,
        @NotBlank(message = "name is required")
        @Size(max = 100, message = "name must not exceed 100 characters")
        String name,
        @Size(max = 255, message = "description must not exceed 255 characters")
        String description,
        List<Long> actionIds,
        OffsetDateTime createdAt,
        OffsetDateTime lastModifiedAt
) {
}
