package org.myorganization.template.core.repository;

import org.myorganization.template.domain.entity.Interface;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

/**
 * Spring Data JPA repository for Interface entity.
 * Supports Specification-based queries for criteria filtering.
 */
public interface InterfaceRepository extends JpaRepository<Interface, Long>, JpaSpecificationExecutor<Interface> {
}
