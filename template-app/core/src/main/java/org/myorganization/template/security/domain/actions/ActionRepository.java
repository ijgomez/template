package org.myorganization.template.security.domain.actions;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.repository.query.Param;

public interface ActionRepository extends PagingAndSortingRepository<Action, Long>, ActionRepositoryQueries {
	
	@Query(value = "select (case when count(a) = 1 then true else false end) from Action a where a.name = :name")
	Optional<Boolean> existByName(@Param("name") String name);

	@Query(value = "select a from Action a join a.profiles p join p.users u where u.username = :username")
	Optional<List<Action>> findActionsByUsername(@Param("username") String username);
	
}
