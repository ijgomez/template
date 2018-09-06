package org.myorganization.template.core.domain.system.cluster;

import org.springframework.data.repository.PagingAndSortingRepository;

public interface ClusterNodeRepository extends PagingAndSortingRepository<ClusterNode, Long>, ClusterNodeRepositoryQueries {
	
}
