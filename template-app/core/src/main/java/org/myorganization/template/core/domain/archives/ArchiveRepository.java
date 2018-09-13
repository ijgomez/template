package org.myorganization.template.core.domain.archives;

import org.springframework.data.repository.PagingAndSortingRepository;

public interface ArchiveRepository extends PagingAndSortingRepository<Archive, Long>, ArchiveRepositoryQueries {
	
}
