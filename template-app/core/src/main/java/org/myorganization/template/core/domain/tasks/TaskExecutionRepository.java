package org.myorganization.template.core.domain.tasks;

import org.springframework.data.repository.PagingAndSortingRepository;

public interface TaskExecutionRepository extends PagingAndSortingRepository<TaskExecution, Long>, TaskExecutionRepositoryQueries {


}
