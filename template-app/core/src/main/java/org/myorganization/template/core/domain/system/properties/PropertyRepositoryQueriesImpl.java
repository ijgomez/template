package org.myorganization.template.core.domain.system.properties;

import java.util.ArrayList;
import java.util.List;

import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;

import org.apache.commons.lang3.StringUtils;
import org.myorganization.template.core.domain.base.RepositoryQueriesBase;

public class PropertyRepositoryQueriesImpl extends RepositoryQueriesBase<Property, PropertyCriteria> implements PropertyRepositoryQueries {
	
	protected List<Predicate> toWhereClause(PropertyCriteria criteria, CriteriaBuilder builder, Root<Property> root) {
		List<Predicate> predicates = null;
		
		if (criteria != null) {
			predicates = new ArrayList<>();
			
			if (criteria.getId() != null) {
				predicates.add(builder.equal(root.get(Property_.id), criteria.getId()));
			}
			
			if (!StringUtils.isEmpty(criteria.getProperty())) {
				predicates.add(builder.like(root.get(Property_.property), criteria.getProperty()));
			}

		}
		return predicates;
	}	
}
