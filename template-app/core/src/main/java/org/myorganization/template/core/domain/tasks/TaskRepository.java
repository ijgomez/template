package org.myorganization.template.core.domain.tasks;

import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.repository.query.Param;

public interface TaskRepository extends PagingAndSortingRepository<Task, Long>, TaskRepositoryQueries {

	@Query("select t from Task t where lower(t.name) = lower(:name)")
	Optional<Task> findByName(@Param("name") String name);
}
