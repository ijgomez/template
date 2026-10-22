package org.myorganization.template.core.repository;

import java.util.List;

import org.myorganization.template.domain.entity.ClusterJob;
import org.myorganization.template.domain.entity.ClusterJobPK;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data JPA repository for ClusterJob entity.
 */
public interface ClusterJobRepository extends JpaRepository<ClusterJob, ClusterJobPK> {

    List<ClusterJob> findByClusterTaskIdOrderByPriorityAsc(Long clusterTaskId);

    List<ClusterJob> findByClusterNodeIdOrderByPriorityAsc(Long clusterNodeId);
}
