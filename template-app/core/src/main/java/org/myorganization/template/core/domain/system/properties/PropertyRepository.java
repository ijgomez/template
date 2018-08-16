package org.myorganization.template.core.domain.system.properties;

import org.springframework.data.repository.PagingAndSortingRepository;

public interface PropertyRepository extends PagingAndSortingRepository<Property, Long>, PropertyRepositoryQueries {
	
}
