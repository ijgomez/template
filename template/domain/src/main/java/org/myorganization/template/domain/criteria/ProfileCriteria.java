package org.myorganization.template.domain.criteria;

/**
 * Filter criteria for Profile listings.
 *
 * @param name filter by profile name (partial match)
 */
public record ProfileCriteria(
        String name
) {
}
