package org.myorganization.template.core.domain.reports;

import org.springframework.data.repository.PagingAndSortingRepository;

public interface ReportRepository extends PagingAndSortingRepository<Report, Long>, ReportRepositoryQueries {
	
}
