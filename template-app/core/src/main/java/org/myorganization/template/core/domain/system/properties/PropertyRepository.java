package org.myorganization.template.core.domain.system.properties;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.repository.query.Param;

public interface PropertyRepository extends PagingAndSortingRepository<Property, Long>, PropertyRepositoryQueries {
	
	@Query("SELECT p FROM Property p WHERE LOWER(p.key) = LOWER(:key)")
	public Property findByKey(@Param("key") String key);
	
}
