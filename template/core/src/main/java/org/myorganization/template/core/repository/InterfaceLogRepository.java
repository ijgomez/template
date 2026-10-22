package org.myorganization.template.core.repository;

import org.myorganization.template.domain.entity.InterfaceLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

/**
 * Spring Data JPA repository for InterfaceLog entity.
 * Supports Specification-based queries for criteria filtering.
 */
public interface InterfaceLogRepository extends JpaRepository<InterfaceLog, Long>, JpaSpecificationExecutor<InterfaceLog> {
}
