package org.myorganization.template.scheduler.domain.taskexecutions;

import org.springframework.data.repository.PagingAndSortingRepository;

public interface TaskExecutionRepository extends PagingAndSortingRepository<TaskExecution, Long>, TaskExecutionRepositoryQueries {


}
