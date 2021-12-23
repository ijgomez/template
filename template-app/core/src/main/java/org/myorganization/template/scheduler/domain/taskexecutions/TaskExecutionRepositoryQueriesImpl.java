package org.myorganization.template.scheduler.domain.taskexecutions;

import java.util.ArrayList;
import java.util.List;

import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;

import org.apache.commons.lang3.StringUtils;
import org.myorganization.template.core.domain.base.RepositoryQueriesBase;

public class TaskExecutionRepositoryQueriesImpl extends RepositoryQueriesBase<TaskExecution, TaskExecutionCriteria> implements TaskExecutionRepositoryQueries {
	
	protected List<Predicate> toWhereClause(TaskExecutionCriteria criteria, CriteriaBuilder builder, Root<TaskExecution> root) {
		List<Predicate> predicates = null;
		
		if (criteria != null) {
			predicates = new ArrayList<>();
			
			if (criteria.getId() != null) {
				predicates.add(builder.equal(root.get(TaskExecution_.id), criteria.getId()));
			}
			
			if (!StringUtils.isEmpty(criteria.getOwner())) {
				predicates.add(builder.like(root.get(TaskExecution_.owner), criteria.getOwner()));
			}
			
			if (criteria.getStatus() != null) {
				predicates.add(builder.equal(root.get(TaskExecution_.status), criteria.getStatus()));
			}
		}
		return predicates;
	}

}
