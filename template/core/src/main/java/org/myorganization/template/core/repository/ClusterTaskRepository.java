package org.myorganization.template.core.repository;

import java.util.Optional;

import org.myorganization.template.domain.entity.ClusterTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for ClusterTask entity.
 */
@Repository
public interface ClusterTaskRepository extends JpaRepository<ClusterTask, Long> {

    Optional<ClusterTask> findByName(String name);
}
