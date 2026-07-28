package org.myorganization.template.core.repository;

import java.time.OffsetDateTime;
import java.util.Optional;

import org.myorganization.template.domain.entity.ClusterBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for ClusterBlock entity.
 * Supports Specification-based queries for criteria filtering.
 */
@Repository
public interface ClusterBlockRepository extends JpaRepository<ClusterBlock, Long>, JpaSpecificationExecutor<ClusterBlock> {

    /**
     * Finds a ClusterBlock by its name.
     *
     * @param name the resource/task name
     * @return the ClusterBlock if found
     */
    Optional<ClusterBlock> findByName(String name);

    /**
     * Acquires a PostgreSQL advisory lock using the hashcode of the resource name.
     * This blocks until the lock is available, providing inter-instance exclusion.
     *
     * @param lockKey the integer key derived from the resource name
     */
    @Query(value = "SELECT pg_advisory_lock(:lockKey)", nativeQuery = true)
    void acquireAdvisoryLock(@Param("lockKey") int lockKey);

    /**
     * Releases a PostgreSQL advisory lock.
     *
     * @param lockKey the integer key derived from the resource name
     */
    @Query(value = "SELECT pg_advisory_unlock(:lockKey)", nativeQuery = true)
    void releaseAdvisoryLock(@Param("lockKey") int lockKey);

    /**
     * Gets the current database timestamp to avoid clock drift between nodes.
     *
     * @return the current database timestamp
     */
    @Query(value = "SELECT CURRENT_TIMESTAMP", nativeQuery = true)
    OffsetDateTime getDatabaseTime();

    /**
     * Updates start_date of a ClusterBlock using the database current timestamp.
     *
     * @param name the block name
     */
    @Modifying
    @Query(value = "UPDATE cluster_block SET start_date = CURRENT_TIMESTAMP WHERE name = :name", nativeQuery = true)
    void updateStartDateWithDbTime(@Param("name") String name);
}
