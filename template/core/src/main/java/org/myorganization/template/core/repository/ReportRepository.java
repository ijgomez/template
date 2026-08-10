package org.myorganization.template.core.repository;

import org.myorganization.template.domain.entity.Report;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for Report entity.
 */
@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {

    /**
     * Finds reports whose name contains the given string (case-insensitive).
     *
     * @param name     partial name to search for
     * @param pageable pagination parameters
     * @return paginated results
     */
    Page<Report> findByNameContainingIgnoreCase(String name, Pageable pageable);
}
