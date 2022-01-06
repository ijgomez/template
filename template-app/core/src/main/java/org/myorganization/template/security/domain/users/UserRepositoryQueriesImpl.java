package org.myorganization.template.security.domain.users;

import java.util.ArrayList;
import java.util.List;

import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;

import org.apache.commons.lang3.StringUtils;
import org.myorganization.template.core.domain.base.RepositoryQueriesBase;
import org.myorganization.template.core.helper.CriteriaBuilderHelper;

public class UserRepositoryQueriesImpl extends RepositoryQueriesBase<User, UserCriteria> implements UserRepositoryQueries {
	
	protected List<Predicate> toWhereClause(UserCriteria criteria, CriteriaBuilder builder, Root<User> root) {
		List<Predicate> predicates = null;
		
		if (criteria != null) {
			predicates = new ArrayList<>();
			
			if (criteria.getId() != null) {
				predicates.add(builder.equal(root.get(User_.id), criteria.getId()));
			}
			
			if (!StringUtils.isEmpty(criteria.getUsername())) {
				predicates.add(CriteriaBuilderHelper.ilike(builder, root.get(User_.username), criteria.getUsername()));
			}

		}
		return predicates;
	}
	
}
