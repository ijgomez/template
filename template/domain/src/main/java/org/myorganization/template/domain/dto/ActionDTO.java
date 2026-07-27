package org.myorganization.template.domain.dto;

import java.time.OffsetDateTime;

import org.myorganization.template.domain.enums.ActionType;

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
        String code,
        ActionType type,
        String name,
        String description,
        OffsetDateTime createdAt,
        OffsetDateTime lastModifiedAt
) {
}
