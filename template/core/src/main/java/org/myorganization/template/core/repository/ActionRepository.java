package org.myorganization.template.core.repository;

import org.myorganization.template.domain.entity.Action;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for Action entity.
 * Supports Specification-based queries for criteria filtering.
 */
@Repository
public interface ActionRepository extends JpaRepository<Action, Long>, JpaSpecificationExecutor<Action> {
}
