package org.myorganization.template.core.repository;

import org.myorganization.template.domain.entity.InterfaceLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for InterfaceLog entity.
 * Supports Specification-based queries for criteria filtering.
 */
@Repository
public interface InterfaceLogRepository extends JpaRepository<InterfaceLog, Long>, JpaSpecificationExecutor<InterfaceLog> {
}
