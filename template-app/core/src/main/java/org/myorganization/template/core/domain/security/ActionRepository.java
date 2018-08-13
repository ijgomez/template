package org.myorganization.template.core.domain.security;

import org.springframework.data.repository.PagingAndSortingRepository;

public interface ActionRepository extends PagingAndSortingRepository<Action, Long>, ActionRepositoryQueries {
	
}
