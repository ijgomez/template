package org.myorganization.template.core.helper;

import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.Path;
import javax.persistence.criteria.Predicate;

public class CriteriaBuilderHelper {

	/**
	 * Case-insensitive like matching anywhere.
	 * 
	 * @param builder
	 * @param field
	 * @param value
	 * @return
	 */
	public static Predicate ilike(CriteriaBuilder builder, Path<String> field, String value) {
		return builder.like(builder.lower(field), builder.lower(builder.literal("%".concat(value).concat("%"))));
	}
	
	private CriteriaBuilderHelper() { }

	
}
