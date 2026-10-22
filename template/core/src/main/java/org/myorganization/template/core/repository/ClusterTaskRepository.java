package org.myorganization.template.core.repository;

import java.util.Optional;

import org.myorganization.template.domain.entity.ClusterTask;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data JPA repository for ClusterTask entity.
 */
public interface ClusterTaskRepository extends JpaRepository<ClusterTask, Long> {

    Optional<ClusterTask> findByName(String name);
}
