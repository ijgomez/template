package org.myorganization.template.security.domain.users;

import org.springframework.data.repository.PagingAndSortingRepository;

public interface UserRepository extends PagingAndSortingRepository<User, Long>, UserRepositoryQueries {
	
}
