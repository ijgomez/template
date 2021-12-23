package org.myorganization.template.reports.domain;

import org.springframework.data.repository.PagingAndSortingRepository;

public interface ReportRepository extends PagingAndSortingRepository<Report, Long>, ReportRepositoryQueries {
	
}
