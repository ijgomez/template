package org.myorganization.template.core.domain.system.properties;

import org.myorganization.template.core.domain.base.RepositoryQueries;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PropertyRepositoryQueries extends RepositoryQueries<Property, PropertyCriteria> {

	@Query("SELECT p FROM Property p WHERE LOWER(p.property) = LOWER(:property)")
	public Property findByProperty(@Param("property") String property);
	
}
