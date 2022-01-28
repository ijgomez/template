package org.myorganization.template.security.domain.users;

import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends PagingAndSortingRepository<User, Long>, UserRepositoryQueries {

	@Query(value = "select (case when count(u) = 1 then true else false end) from User u where u.username = :username")
	Optional<Boolean> existUsername(@Param("username") String username);
	
}
