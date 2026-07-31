package org.myorganization.template.webapp.controller;

import java.time.OffsetDateTime;

import org.myorganization.template.core.service.AuditService;
import org.myorganization.template.domain.criteria.AuditCriteria;
import org.myorganization.template.domain.dto.AuditLogDTO;
import org.myorganization.template.domain.enums.AuditSection;
import org.myorganization.template.domain.enums.OperationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for audit log consultation (read-only).
 * <p>
 * Exposes GET endpoints for querying system audit records under the
 * administration module. No create, update or delete operations are
 * available — audit logs are immutable.
 */
@RestController
@RequestMapping("/api/v1/administration/audit")
public class AuditController {

    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    /**
     * Lists audit log entries with pagination and optional filters.
     *
     * @param fromDate      optional filter: start date (inclusive)
     * @param toDate        optional filter: end date (inclusive)
     * @param username      optional filter by username (partial match)
     * @param operationType optional filter by operation type
     * @param section       optional filter by audit section
     * @param pageable      pagination information (page, size, sort)
     * @return 200 OK with paginated list of audit log entries
     */
    @GetMapping
    public ResponseEntity<Page<AuditLogDTO>> findAll(
            @RequestParam(required = false) OffsetDateTime fromDate,
            @RequestParam(required = false) OffsetDateTime toDate,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) OperationType operationType,
            @RequestParam(required = false) AuditSection section,
            Pageable pageable) {

        AuditCriteria criteria = new AuditCriteria(fromDate, toDate, username, operationType, section);
        Page<AuditLogDTO> page = auditService.findByCriteria(criteria, pageable);
        return ResponseEntity.ok(page);
    }

    /**
     * Counts audit log entries matching the given filters.
     *
     * @param fromDate      optional filter: start date (inclusive)
     * @param toDate        optional filter: end date (inclusive)
     * @param username      optional filter by username (partial match)
     * @param operationType optional filter by operation type
     * @param section       optional filter by audit section
     * @return 200 OK with the total count
     */
    @GetMapping("/count")
    public ResponseEntity<Long> count(
            @RequestParam(required = false) OffsetDateTime fromDate,
            @RequestParam(required = false) OffsetDateTime toDate,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) OperationType operationType,
            @RequestParam(required = false) AuditSection section) {

        AuditCriteria criteria = new AuditCriteria(fromDate, toDate, username, operationType, section);
        long total = auditService.countByCriteria(criteria);
        return ResponseEntity.ok(total);
    }

}
