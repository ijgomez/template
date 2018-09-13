package org.myorganization.template.core.domain.archives;

import java.util.ArrayList;
import java.util.List;

import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;

import org.apache.commons.lang3.StringUtils;
import org.myorganization.template.core.domain.base.RepositoryQueriesBase;
import org.myorganization.template.core.domain.base.RepositoryQueriesHelper;

public class ArchiveRepositoryQueriesImpl extends RepositoryQueriesBase<Archive, ArchiveCriteria> implements ArchiveRepositoryQueries {
	
	protected List<Predicate> toWhereClause(ArchiveCriteria criteria, CriteriaBuilder builder, Root<Archive> root) {
		List<Predicate> predicates = null;
		
		if (criteria != null) {
			predicates = new ArrayList<>();
			
			if (criteria.getId() != null) {
				predicates.add(builder.equal(root.get(Archive_.id), criteria.getId()));
			}
			
			if (!StringUtils.isEmpty(criteria.getFilename())) {
				predicates.add(builder.like(root.get(Archive_.filename), RepositoryQueriesHelper.wildcard(criteria.getFilename())));
			}
			
			if (!StringUtils.isEmpty(criteria.getFiletype())) {
				predicates.add(builder.like(root.get(Archive_.filename), RepositoryQueriesHelper.wildcard(criteria.getFiletype())));
			}
		}
		return predicates;
	}
	
}
