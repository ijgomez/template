package org.myorganization.template.core.repository;

import java.time.Instant;
import java.util.Optional;

import org.myorganization.template.domain.entity.ClusterBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Spring Data JPA repository for ClusterBlock entity.
 * Supports Specification-based queries for criteria filtering.
 */
public interface ClusterBlockRepository extends JpaRepository<ClusterBlock, Long>, JpaSpecificationExecutor<ClusterBlock> {

    /**
     * Finds a ClusterBlock by its name.
     *
     * @param name the resource/task name
     * @return the ClusterBlock if found
     */
    Optional<ClusterBlock> findByName(String name);

    /**
     * Gets the current database timestamp to avoid clock drift between nodes.
     *
     * @return the current database timestamp
     */
    @Query(value = "SELECT CURRENT_TIMESTAMP", nativeQuery = true)
    Instant getDatabaseTime();

    /**
     * Updates start_date of a ClusterBlock using the database current timestamp.
     *
     * @param name the block name
     */
    @Modifying
    @Query(value = "UPDATE {h-schema}cluster_block SET start_date = CURRENT_TIMESTAMP WHERE name = :name", nativeQuery = true)
    void updateStartDateWithDbTime(@Param("name") String name);
}
