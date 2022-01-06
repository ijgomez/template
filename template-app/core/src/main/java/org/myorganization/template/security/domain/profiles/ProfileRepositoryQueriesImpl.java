package org.myorganization.template.security.domain.profiles;

import java.util.ArrayList;
import java.util.List;

import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;

import org.apache.commons.lang3.StringUtils;
import org.myorganization.template.core.domain.base.RepositoryQueriesBase;
import org.myorganization.template.core.helper.CriteriaBuilderHelper;

public class ProfileRepositoryQueriesImpl extends RepositoryQueriesBase<Profile, ProfileCriteria> implements ProfileRepositoryQueries {
	
	protected List<Predicate> toWhereClause(ProfileCriteria criteria, CriteriaBuilder builder, Root<Profile> root) {
		List<Predicate> predicates = null;
		
		if (criteria != null) {
			predicates = new ArrayList<>();
			
			if (criteria.getId() != null) {
				predicates.add(builder.equal(root.get(Profile_.id), criteria.getId()));
			}
			
			if (!StringUtils.isEmpty(criteria.getName())) {
				predicates.add(CriteriaBuilderHelper.ilike(builder, root.get(Profile_.name), criteria.getName()));
			}
			
			if (!StringUtils.isEmpty(criteria.getDescription())) {
				predicates.add(CriteriaBuilderHelper.ilike(builder, root.get(Profile_.description), criteria.getDescription()));
			}

		}
		return predicates;
	}
	
}
