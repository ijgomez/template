package org.myorganization.template.webapp.controller;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;

import org.myorganization.template.core.service.InterfaceService;
import org.myorganization.template.domain.criteria.InterfaceCriteria;
import org.myorganization.template.domain.criteria.InterfaceLogCriteria;
import org.myorganization.template.domain.dto.InterfaceDTO;
import org.myorganization.template.domain.dto.InterfaceLogDTO;
import org.myorganization.template.domain.enums.InterfaceLogStatus;
import org.myorganization.template.domain.enums.InterfaceStatus;
import org.myorganization.template.domain.enums.InterfaceOperationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller implementation for interface monitoring (read-only).
 * <p>
 * Exposes GET endpoints for interface configuration and operation log monitoring.
 * No CUD operations are available; interfaces are managed externally and logs
 * are append-only.
 */
@RestController
@RequestMapping("/api/v1/interfaces")
public class InterfaceControllerImpl implements InterfaceController {

    /** Fields on {@code Interface} that clients may use to sort the configuration listing (SEC-10). */
    private static final Set<String> INTERFACE_SORT_FIELDS =
            Set.of("id", "name", "description", "url", "protocol", "status", "checkFrequency",
                    "createdAt", "lastModifiedAt");

    /** Fields on {@code InterfaceLog} that clients may use to sort the monitor listing (SEC-10). */
    private static final Set<String> INTERFACE_LOG_SORT_FIELDS =
            Set.of("id", "timestamp", "operationType", "interfaceName", "requestPayload",
                    "responsePayload", "status");

    private final InterfaceService interfaceService;

    public InterfaceControllerImpl(InterfaceService interfaceService) {
        this.interfaceService = interfaceService;
    }

    // ─── Configuration ───────────────────────────────────────────────────────────

    @Override
    public ResponseEntity<List<InterfaceDTO>> findAll() {
        List<InterfaceDTO> interfaces = interfaceService.findAll();
        return ResponseEntity.ok(interfaces);
    }

    @Override
    public ResponseEntity<Page<InterfaceDTO>> findByCriteria(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String protocol,
            @RequestParam(required = false) InterfaceStatus status,
            @RequestParam(required = false) String sort) {
        InterfaceCriteria criteria = new InterfaceCriteria(name, protocol, status);
        Pageable pageable = SortWhitelist.buildPageable(page, size, sort, INTERFACE_SORT_FIELDS);
        return ResponseEntity.ok(interfaceService.findByCriteria(criteria, pageable));
    }

    @Override
    @GetMapping("/configuration/{id}")
    public ResponseEntity<InterfaceDTO> findById(@PathVariable Long id) {
        InterfaceDTO dto = interfaceService.findById(id);
        return ResponseEntity.ok(dto);
    }

    // ─── Monitor ─────────────────────────────────────────────────────────────────

    @Override
    public ResponseEntity<Page<InterfaceLogDTO>> findLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) OffsetDateTime fromDate,
            @RequestParam(required = false) OffsetDateTime toDate,
            @RequestParam(required = false) InterfaceOperationType operationType,
            @RequestParam(required = false) String interfaceName,
            @RequestParam(required = false) InterfaceLogStatus status,
            @RequestParam(required = false) String sort) {

        InterfaceLogCriteria criteria = new InterfaceLogCriteria(fromDate, toDate, operationType, interfaceName, status);
        Pageable pageable = SortWhitelist.buildPageable(page, size, sort, INTERFACE_LOG_SORT_FIELDS);
        Page<InterfaceLogDTO> result = interfaceService.findLogsByCriteria(criteria, pageable);
        return ResponseEntity.ok(result);
    }

    @Override
    public ResponseEntity<Long> countLogs(
            @RequestParam(required = false) OffsetDateTime fromDate,
            @RequestParam(required = false) OffsetDateTime toDate,
            @RequestParam(required = false) InterfaceOperationType operationType,
            @RequestParam(required = false) String interfaceName,
            @RequestParam(required = false) InterfaceLogStatus status) {

        InterfaceLogCriteria criteria = new InterfaceLogCriteria(fromDate, toDate, operationType, interfaceName, status);
        long total = interfaceService.countLogsByCriteria(criteria);
        return ResponseEntity.ok(total);
    }

    @Override
    @GetMapping("/monitor/{id}")
    public ResponseEntity<InterfaceLogDTO> findLogById(@PathVariable Long id) {
        InterfaceLogDTO dto = interfaceService.findLogById(id);
        return ResponseEntity.ok(dto);
    }

}
