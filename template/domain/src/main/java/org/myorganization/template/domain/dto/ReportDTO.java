package org.myorganization.template.domain.dto;

import java.time.OffsetDateTime;

/**
 * Data Transfer Object for Report entity.
 *
 * @param id              report identifier ({@code null} for creation)
 * @param name            report name
 * @param description     report description
 * @param createdAt       creation timestamp
 * @param lastModifiedAt  last modification timestamp
 */
public record ReportDTO(
        Long id,
        String name,
        String description,
        OffsetDateTime createdAt,
        OffsetDateTime lastModifiedAt
) {
}
