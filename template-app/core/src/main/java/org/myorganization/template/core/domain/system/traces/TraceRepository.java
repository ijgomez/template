package org.myorganization.template.core.domain.system.traces;

import org.springframework.data.repository.PagingAndSortingRepository;

public interface TraceRepository extends PagingAndSortingRepository<Trace, Long>, TraceRepositoryQueries {
	
}
