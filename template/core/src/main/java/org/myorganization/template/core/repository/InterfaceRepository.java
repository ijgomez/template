package org.myorganization.template.core.repository;

import org.myorganization.template.domain.entity.Interface;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for Interface entity.
 */
@Repository
public interface InterfaceRepository extends JpaRepository<Interface, Long> {
}
