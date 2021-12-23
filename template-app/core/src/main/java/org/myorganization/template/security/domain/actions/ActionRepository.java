package org.myorganization.template.security.domain.actions;

import org.springframework.data.repository.PagingAndSortingRepository;

public interface ActionRepository extends PagingAndSortingRepository<Action, Long>, ActionRepositoryQueries {
	
}
