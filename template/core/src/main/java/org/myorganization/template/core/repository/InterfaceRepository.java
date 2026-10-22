package org.myorganization.template.core.repository;

import org.myorganization.template.domain.entity.Interface;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data JPA repository for Interface entity.
 */
public interface InterfaceRepository extends JpaRepository<Interface, Long> {
}
