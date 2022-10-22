package org.myorganization.template.cluster.domain.node;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.repository.query.Param;

public interface ClusterNodeRepository extends PagingAndSortingRepository<ClusterNode, Long>, ClusterNodeRepositoryQueries {
	
	@Query("SELECT cn FROM ClusterNode cn WHERE LOWER(cn.hostname) = LOWER(:hostname)")
	public ClusterNode findByHostname(@Param("hostname") String hostname);
}
