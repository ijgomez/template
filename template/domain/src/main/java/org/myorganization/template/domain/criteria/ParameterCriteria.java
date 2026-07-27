package org.myorganization.template.domain.criteria;

import org.myorganization.template.domain.enums.ParameterType;

/**
 * Filter criteria for Parameter listings.
 *
 * @param code        filter by parameter code (partial match)
 * @param description filter by description (partial match)
 * @param type        filter by parameter type
 */
public record ParameterCriteria(
        String code,
        String description,
        ParameterType type
) {
}
