package org.myorganization.template.domain.dto;

/**
 * Data Transfer Object for ClusterJob entity.
 *
 * @param clusterNodeId cluster node identifier
 * @param clusterTaskId cluster task identifier
 * @param priority      job priority
 * @param enabled       whether the job is enabled
 */
public record ClusterJobDTO(
        Long clusterNodeId,
        Long clusterTaskId,
        Integer priority,
        Boolean enabled
) {
}
