package org.myorganization.template.security.domain.actions;

import java.util.ArrayList;
import java.util.List;

import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;

import org.apache.commons.lang3.StringUtils;
import org.myorganization.template.core.domain.base.RepositoryQueriesBase;
import org.myorganization.template.core.helper.CriteriaBuilderHelper;

public class ActionRepositoryQueriesImpl extends RepositoryQueriesBase<Action, ActionCriteria> implements ActionRepositoryQueries {
	
	protected List<Predicate> toWhereClause(ActionCriteria criteria, CriteriaBuilder builder, Root<Action> root) {
		List<Predicate> predicates = null;
		
		if (criteria != null) {
			predicates = new ArrayList<>();
			
			if (criteria.getId() != null) {
				predicates.add(builder.equal(root.get(Action_.id), criteria.getId()));
			}
			
			if (!StringUtils.isEmpty(criteria.getName())) {
				predicates.add(CriteriaBuilderHelper.ilike(builder, root.get(Action_.name), criteria.getName()));
			}
			
			if (!StringUtils.isEmpty(criteria.getDescription())) {
				predicates.add(CriteriaBuilderHelper.ilike(builder, root.get(Action_.description), criteria.getDescription()));
			}

		}
		return predicates;
	}
	
}
