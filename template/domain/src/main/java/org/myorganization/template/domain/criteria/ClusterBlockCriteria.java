package org.myorganization.template.domain.criteria;

/**
 * Filter criteria for ClusterBlock listings.
 *
 * @param name filter by block name (partial match)
 */
public record ClusterBlockCriteria(
        String name
) {
}
