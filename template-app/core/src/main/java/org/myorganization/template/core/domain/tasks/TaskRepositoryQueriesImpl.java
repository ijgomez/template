package org.myorganization.template.core.domain.tasks;

import java.util.ArrayList;
import java.util.List;

import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;

import org.apache.commons.lang3.StringUtils;
import org.myorganization.template.core.domain.base.RepositoryQueriesBase;

public class TaskRepositoryQueriesImpl extends RepositoryQueriesBase<Task, TaskCriteria> implements TaskRepositoryQueries {
	
	protected List<Predicate> toWhereClause(TaskCriteria criteria, CriteriaBuilder builder, Root<Task> root) {
		List<Predicate> predicates = null;
		
		if (criteria != null) {
			predicates = new ArrayList<>();
			
			if (criteria.getId() != null) {
				predicates.add(builder.equal(root.get(Task_.id), criteria.getId()));
			}
			
			if (!StringUtils.isEmpty(criteria.getName())) {
				predicates.add(builder.like(root.get(Task_.name), criteria.getName()));
			}
			
			if (!StringUtils.isEmpty(criteria.getDescription())) {
				predicates.add(builder.like(root.get(Task_.description), criteria.getDescription()));
			}
		}
		return predicates;
	}

}
