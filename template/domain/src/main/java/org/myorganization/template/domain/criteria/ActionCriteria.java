package org.myorganization.template.domain.criteria;

import org.myorganization.template.domain.enums.ActionType;

/**
 * Filter criteria for Action listings.
 *
 * @param code filter by action code (partial match)
 * @param name filter by action name (partial match)
 * @param type filter by action type
 */
public record ActionCriteria(
        String code,
        String name,
        ActionType type
) {
}
