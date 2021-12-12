package org.myorganization.template.core.domain.system.cluster;

import java.util.ArrayList;
import java.util.List;

import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;

import org.apache.commons.lang3.StringUtils;
import org.myorganization.template.core.domain.base.RepositoryQueriesBase;

public class ClusterNodeRepositoryQueriesImpl extends RepositoryQueriesBase<ClusterNode, ClusterNodeCriteria> implements ClusterNodeRepositoryQueries {
	
	protected List<Predicate> toWhereClause(ClusterNodeCriteria criteria, CriteriaBuilder builder, Root<ClusterNode> root) {
		List<Predicate> predicates = null;
		
		if (criteria != null) {
			predicates = new ArrayList<>();
			
			if (criteria.getId() != null) {
				predicates.add(builder.equal(root.get(ClusterNode_.id), criteria.getId()));
			}
			
			if (!StringUtils.isEmpty(criteria.getHostname())) {
				predicates.add(builder.like(root.get(ClusterNode_.hostname), criteria.getHostname()));
			}
			
			if (!StringUtils.isEmpty(criteria.getIp())) {
				predicates.add(builder.like(root.get(ClusterNode_.ip), criteria.getIp()));
			}
			
			if (criteria.getStatus() != null) {
				// predicates.add(builder.like(root.get(ClusterNode_.status), criteria.getStatus()));
			}

		}
		return predicates;
	}	
}
