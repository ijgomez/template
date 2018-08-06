package org.myorganization.template.core.domain.system.traces;

import java.util.ArrayList;
import java.util.List;

import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;

import org.apache.commons.lang3.StringUtils;
import org.myorganization.template.core.domain.base.RepositoryQueriesBase;

public class TraceRepositoryQueriesImpl extends RepositoryQueriesBase<Trace, TraceCriteria> implements TraceRepositoryQueries {
	
	protected List<Predicate> toWhereClause(TraceCriteria criteria, CriteriaBuilder builder, Root<Trace> root) {
		List<Predicate> predicates = null;
		
		if (criteria != null) {
			predicates = new ArrayList<>();
			
			if (criteria.getId() != null) {
				predicates.add(builder.equal(root.get(Trace_.id), criteria.getId()));
			}
			
			if (!StringUtils.isEmpty(criteria.getMessage())) {
				predicates.add(builder.like(root.get(Trace_.message), criteria.getMessage()));
			}

		}
		return predicates;
	}
	
}
