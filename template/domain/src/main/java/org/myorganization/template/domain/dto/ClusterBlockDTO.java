package org.myorganization.template.domain.dto;

import java.time.OffsetDateTime;

/**
 * Data Transfer Object for ClusterBlock entity.
 *
 * @param id        cluster block identifier
 * @param name      block name
 * @param startDate block start date
 * @param avgTime   average execution time in milliseconds
 * @param minTime   minimum execution time in milliseconds
 * @param maxTime   maximum execution time in milliseconds
 * @param total     total executions
 */
public record ClusterBlockDTO(
        Long id,
        String name,
        OffsetDateTime startDate,
        Long avgTime,
        Long minTime,
        Long maxTime,
        Long total
) {
}
