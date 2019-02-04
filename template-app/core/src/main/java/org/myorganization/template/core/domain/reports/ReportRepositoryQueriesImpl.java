package org.myorganization.template.core.domain.reports;

import java.util.ArrayList;
import java.util.List;

import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;

import org.apache.commons.lang3.StringUtils;
import org.myorganization.template.core.domain.base.RepositoryQueriesBase;
import org.myorganization.template.core.domain.base.RepositoryQueriesHelper;

public class ReportRepositoryQueriesImpl extends RepositoryQueriesBase<Report, ReportCriteria> implements ReportRepositoryQueries {
	
	protected List<Predicate> toWhereClause(ReportCriteria criteria, CriteriaBuilder builder, Root<Report> root) {
		List<Predicate> predicates = null;
		
		if (criteria != null) {
			predicates = new ArrayList<>();
			
			if (criteria.getId() != null) {
				predicates.add(builder.equal(root.get(Report_.id), criteria.getId()));
			}
			
			if (!StringUtils.isEmpty(criteria.getName())) {
				predicates.add(builder.like(root.get(Report_.name), RepositoryQueriesHelper.wildcard(criteria.getName())));
			}
			
			if (!StringUtils.isEmpty(criteria.getDescription())) {
				predicates.add(builder.like(root.get(Report_.description), RepositoryQueriesHelper.wildcard(criteria.getDescription())));
			}
		}
		return predicates;
	}
	
}
