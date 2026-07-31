package org.myorganization.template.core.service;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import org.myorganization.template.core.repository.AuditLogRepository;
import org.myorganization.template.domain.criteria.AuditCriteria;
import org.myorganization.template.domain.dto.AuditLogDTO;
import org.myorganization.template.domain.dto.AuditLogEntry;
import org.myorganization.template.domain.entity.AuditLog;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for managing audit log entries (read-only from API).
 * <p>
 * Provides paginated querying with filters and an internal {@code log} method
 * used by the {@link org.myorganization.template.core.audit.AuditAspect} to
 * persist audit entries. Audit logs are immutable — no update or delete
 * operations are exposed.
 * <p>
 * Implements retention archival: when a configured retention period is exceeded,
 * old records are archived (deleted from the active table).
 */
@Service
@Transactional
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final AuditLogRepository auditLogRepository;
    private final ParameterService parameterService;

    public AuditService(AuditLogRepository auditLogRepository, ParameterService parameterService) {
        this.auditLogRepository = auditLogRepository;
        this.parameterService = parameterService;
    }

    /**
     * Finds audit log entries matching the given criteria with pagination.
     * <p>
     * Supports filtering by date range (fromDate/toDate), username,
     * operation type, and section.
     *
     * @param criteria filter criteria
     * @param pageable pagination information
     * @return a page of matching audit log entries
     */
    @Transactional(readOnly = true)
    public Page<AuditLogDTO> findByCriteria(AuditCriteria criteria, Pageable pageable) {
        Specification<AuditLog> spec = buildSpecification(criteria);
        return auditLogRepository.findAll(spec, pageable).map(this::toDTO);
    }

    /**
     * Counts audit log entries matching the given criteria.
     *
     * @param criteria filter criteria
     * @return total count of matching entries
     */
    @Transactional(readOnly = true)
    public long countByCriteria(AuditCriteria criteria) {
        Specification<AuditLog> spec = buildSpecification(criteria);
        return auditLogRepository.count(spec);
    }

    /**
     * Persists an audit log entry. Internal method called by the AuditAspect.
     * <p>
     * This method is the single point of audit persistence. It sets the
     * timestamp to the current UTC time and saves the entry.
     * <p>
     * After persisting, it checks if retention archival is needed.
     *
     * @param entry the audit log entry data to persist
     */
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW, noRollbackFor = Exception.class)
    public void log(AuditLogEntry entry) {
        AuditLog auditLog = new AuditLog();
        auditLog.setTimestamp(OffsetDateTime.now(ZoneOffset.UTC));
        auditLog.setUsername(entry.username());
        auditLog.setOperationType(entry.operationType());
        auditLog.setSection(entry.section());
        auditLog.setEntityId(entry.entityId());
        auditLog.setEntityName(entry.entityName());
        auditLog.setDetail(entry.detail());

        auditLogRepository.save(auditLog);
    }

    /**
     * Archives (deletes) audit log records older than the configured retention period.
     * <p>
     * The retention period is read from the system parameter {@code AUDIT_RETENTION_DAYS}.
     * If the parameter is not configured or is invalid, no archival is performed.
     */
    void archiveIfRetentionExceeded() {
        try {
            var paramDTO = parameterService.findByCode("AUDIT_RETENTION_DAYS");
            if (paramDTO == null || paramDTO.value() == null || paramDTO.value().isBlank()) {
                return;
            }

            int retentionDays = Integer.parseInt(paramDTO.value());
            if (retentionDays <= 0) {
                return;
            }

            OffsetDateTime cutoffDate = OffsetDateTime.now(ZoneOffset.UTC).minusDays(retentionDays);

            long deleted = auditLogRepository.deleteByTimestampBefore(cutoffDate);
            if (deleted > 0) {
                log.info("Archived {} audit log records older than {} days", deleted, retentionDays);
            }
        } catch (Exception e) {
            log.debug("Retention archival skipped: {}", e.getMessage());
        }
    }

    private Specification<AuditLog> buildSpecification(AuditCriteria criteria) {
        Specification<AuditLog> spec = (root, query, cb) -> cb.conjunction();

        if (criteria.fromDate() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.greaterThanOrEqualTo(root.get("timestamp"), criteria.fromDate()));
        }

        if (criteria.toDate() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.lessThanOrEqualTo(root.get("timestamp"), criteria.toDate()));
        }

        if (criteria.username() != null && !criteria.username().isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("username")), "%" + criteria.username().toLowerCase() + "%"));
        }

        if (criteria.operationType() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("operationType"), criteria.operationType()));
        }

        if (criteria.section() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("section"), criteria.section()));
        }

        return spec;
    }

    private AuditLogDTO toDTO(AuditLog entity) {
        return new AuditLogDTO(
                entity.getId(),
                entity.getTimestamp(),
                entity.getUsername(),
                entity.getOperationType(),
                entity.getSection(),
                entity.getEntityId(),
                entity.getEntityName(),
                entity.getDetail()
        );
    }
}
