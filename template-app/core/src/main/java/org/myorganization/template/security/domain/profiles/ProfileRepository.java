package org.myorganization.template.security.domain.profiles;

import org.springframework.data.repository.PagingAndSortingRepository;

public interface ProfileRepository extends PagingAndSortingRepository<Profile, Long>, ProfileRepositoryQueries {
	
}
