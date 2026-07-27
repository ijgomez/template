package org.myorganization.template.domain.dto;

/**
 * Data Transfer Object for Report filter definition.
 *
 * @param name     filter name
 * @param type     filter type
 * @param required whether the filter is required
 */
public record ReportFilterDTO(
        String name,
        String type,
        boolean required
) {
}
