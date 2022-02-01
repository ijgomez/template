package org.myorganization.template.security.domain.profiles;

import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.repository.query.Param;

public interface ProfileRepository extends PagingAndSortingRepository<Profile, Long>, ProfileRepositoryQueries {
	
	@Query(value = "select (case when count(p) = 1 then true else false end) from Profile p where p.name = :name")
	Optional<Boolean> existByName(@Param("name") String name);
	
}
