package org.myorganization.template.core.repository;

import org.myorganization.template.domain.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for Report entity.
 */
@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {
}
