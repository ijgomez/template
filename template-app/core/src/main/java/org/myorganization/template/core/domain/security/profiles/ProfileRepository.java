package org.myorganization.template.core.domain.security.profiles;

import org.springframework.data.repository.PagingAndSortingRepository;

public interface ProfileRepository extends PagingAndSortingRepository<Profile, Long>, ProfileRepositoryQueries {
	
}
