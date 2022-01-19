package org.myorganization.template.reports.domain.reportengine;

import org.springframework.data.repository.PagingAndSortingRepository;

public interface ReportEngineRepository extends PagingAndSortingRepository<ReportEngine, Long>, ReportEngineRepositoryQueries {
	
}
