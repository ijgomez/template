package org.myorganization.template.webapp.controller;

import java.time.OffsetDateTime;
import java.util.List;

import org.myorganization.template.core.service.InterfaceService;
import org.myorganization.template.domain.criteria.InterfaceLogCriteria;
import org.myorganization.template.domain.dto.InterfaceDTO;
import org.myorganization.template.domain.dto.InterfaceLogDTO;
import org.myorganization.template.domain.enums.InterfaceLogStatus;
import org.myorganization.template.domain.enums.InterfaceOperationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
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
        Pageable pageable = buildPageable(page, size, sort);
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
    public ResponseEntity<InterfaceLogDTO> findLogById(@PathVariable Long id) {
        InterfaceLogDTO dto = interfaceService.findLogById(id);
        return ResponseEntity.ok(dto);
    }

    /**
     * Builds a Pageable from page, size and an optional sort string.
     *
     * @param page zero-indexed page number
     * @param size page size
     * @param sort sort string in format "field,direction" (e.g. "timestamp,desc")
     * @return a Pageable with sorting if specified
     */
    private Pageable buildPageable(int page, int size, String sort) {
        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",");
            String property = parts[0];
            Sort.Direction direction = parts.length > 1 && "desc".equalsIgnoreCase(parts[1])
                    ? Sort.Direction.DESC
                    : Sort.Direction.ASC;
            return PageRequest.of(page, size, Sort.by(direction, property));
        }
        return PageRequest.of(page, size);
    }

}
