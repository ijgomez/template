package org.myorganization.template.core.repository;

import java.time.OffsetDateTime;

import org.myorganization.template.domain.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for audit log entries.
 * <p>
 * Supports standard CRUD for persistence (used internally by AuditAspect)
 * and specification-based queries for the audit consultation endpoint.
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long>, JpaSpecificationExecutor<AuditLog> {

    /**
     * Deletes all audit log entries with a timestamp before the given cutoff date.
     * Used for retention archival.
     *
     * @param cutoffDate the date before which records should be deleted
     * @return the number of records deleted
     */
    @Modifying
    @Query("DELETE FROM AuditLog a WHERE a.timestamp < :cutoffDate")
    long deleteByTimestampBefore(@Param("cutoffDate") OffsetDateTime cutoffDate);
}
