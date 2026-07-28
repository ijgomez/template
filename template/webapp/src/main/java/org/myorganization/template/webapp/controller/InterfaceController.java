package org.myorganization.template.webapp.controller;

import java.time.OffsetDateTime;
import java.util.List;

import org.myorganization.template.domain.dto.InterfaceDTO;
import org.myorganization.template.domain.dto.InterfaceLogDTO;
import org.myorganization.template.domain.enums.InterfaceLogStatus;
import org.myorganization.template.domain.enums.InterfaceOperationType;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

/**
 * REST controller contract for interface monitoring (read-only).
 * <p>
 * Provides endpoints for interface configuration listing and operation
 * log monitoring. No CUD operations are exposed via API.
 */
public interface InterfaceController {

    // ─── Configuration (/api/v1/interfaces/configuration) ────────────────────────

    /**
     * Lists all interfaces with their current status.
     *
     * @return 200 OK with the list of interfaces
     */
    @GetMapping("/configuration")
    ResponseEntity<List<InterfaceDTO>> findAll();

    /**
     * Retrieves an interface by its identifier.
     *
     * @param id the interface identifier
     * @return 200 OK with the interface detail, or 404 if not found
     */
    @GetMapping("/configuration/{id}")
    ResponseEntity<InterfaceDTO> findById(@PathVariable Long id);

    // ─── Monitor (/api/v1/interfaces/monitor) ────────────────────────────────────

    /**
     * Lists interface operation logs with pagination and optional filters.
     *
     * @param page          zero-indexed page number
     * @param size          page size
     * @param fromDate      filter from date (inclusive)
     * @param toDate        filter to date (inclusive)
     * @param operationType filter by operation type (IN, OUT)
     * @param interfaceName filter by interface name (partial match)
     * @param status        filter by log status (SUCCESS, ERROR)
     * @return 200 OK with paginated interface log list
     */
    @GetMapping("/monitor")
    ResponseEntity<Page<InterfaceLogDTO>> findLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) OffsetDateTime fromDate,
            @RequestParam(required = false) OffsetDateTime toDate,
            @RequestParam(required = false) InterfaceOperationType operationType,
            @RequestParam(required = false) String interfaceName,
            @RequestParam(required = false) InterfaceLogStatus status);

    /**
     * Counts interface operation logs matching the given filters.
     *
     * @param fromDate      filter from date (inclusive)
     * @param toDate        filter to date (inclusive)
     * @param operationType filter by operation type (IN, OUT)
     * @param interfaceName filter by interface name (partial match)
     * @param status        filter by log status (SUCCESS, ERROR)
     * @return 200 OK with the total count
     */
    @GetMapping("/monitor/count")
    ResponseEntity<Long> countLogs(
            @RequestParam(required = false) OffsetDateTime fromDate,
            @RequestParam(required = false) OffsetDateTime toDate,
            @RequestParam(required = false) InterfaceOperationType operationType,
            @RequestParam(required = false) String interfaceName,
            @RequestParam(required = false) InterfaceLogStatus status);

    /**
     * Retrieves an interface operation log entry by its identifier.
     *
     * @param id the interface log identifier
     * @return 200 OK with the log detail, or 404 if not found
     */
    @GetMapping("/monitor/{id}")
    ResponseEntity<InterfaceLogDTO> findLogById(@PathVariable Long id);

}
