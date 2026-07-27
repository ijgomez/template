package org.myorganization.template.domain.dto;

import java.time.OffsetDateTime;
import java.util.List;

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
        String name,
        String description,
        List<Long> actionIds,
        OffsetDateTime createdAt,
        OffsetDateTime lastModifiedAt
) {
}
