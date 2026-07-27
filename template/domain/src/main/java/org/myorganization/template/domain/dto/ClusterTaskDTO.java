package org.myorganization.template.domain.dto;

/**
 * Data Transfer Object for ClusterTask entity.
 *
 * @param id          cluster task identifier
 * @param name        task name
 * @param description task description
 * @param nodes       number of nodes assigned
 * @param minNodes    minimum nodes required
 */
public record ClusterTaskDTO(
        Long id,
        String name,
        String description,
        Integer nodes,
        Integer minNodes
) {
}
