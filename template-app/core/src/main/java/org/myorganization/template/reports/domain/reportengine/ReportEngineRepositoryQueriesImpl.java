package org.myorganization.template.reports.domain.reportengine;

import java.util.ArrayList;
import java.util.List;

import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;

import org.apache.commons.lang3.StringUtils;
import org.myorganization.template.core.domain.base.RepositoryQueriesBase;
import org.myorganization.template.core.helper.CriteriaBuilderHelper;

public class ReportEngineRepositoryQueriesImpl extends RepositoryQueriesBase<ReportEngine, ReportEngineCriteria> implements ReportEngineRepositoryQueries {
	
	protected List<Predicate> toWhereClause(ReportEngineCriteria criteria, CriteriaBuilder builder, Root<ReportEngine> root) {
		List<Predicate> predicates = null;
		
		if (criteria != null) {
			predicates = new ArrayList<>();
			
			if (criteria.getId() != null) {
				predicates.add(builder.equal(root.get(ReportEngine_.id), criteria.getId()));
			}
			
			if (!StringUtils.isEmpty(criteria.getType())) {
				predicates.add(CriteriaBuilderHelper.ilike(builder, root.get(ReportEngine_.type), criteria.getType()));
			}
			
			if (!StringUtils.isEmpty(criteria.getDescription())) {
				predicates.add(CriteriaBuilderHelper.ilike(builder, root.get(ReportEngine_.description), criteria.getDescription()));
			}
		}
		return predicates;
	}
	
}
