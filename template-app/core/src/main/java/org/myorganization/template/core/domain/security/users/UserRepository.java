package org.myorganization.template.core.domain.security.users;

import org.springframework.data.repository.PagingAndSortingRepository;

public interface UserRepository extends PagingAndSortingRepository<User, Long>, UserRepositoryQueries {
	
}
