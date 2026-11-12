package org.myorganization.template.webapp.controller;

import java.time.OffsetDateTime;
import java.util.List;

import org.myorganization.template.domain.dto.InterfaceDTO;
import org.myorganization.template.domain.dto.InterfaceLogDTO;
import org.myorganization.template.domain.enums.InterfaceLogStatus;
import org.myorganization.template.domain.enums.InterfaceStatus;
import org.myorganization.template.domain.enums.InterfaceOperationType;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
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
     * Searches interfaces with pagination and optional filters.
     *
     * @param page     zero-indexed page number
     * @param size     page size
     * @param name     filter by interface name (partial, case-insensitive)
     * @param protocol filter by protocol (partial, case-insensitive)
     * @param status   filter by interface status
     * @param sort     sort string "field,direction" (e.g. "name,asc")
     * @return 200 OK with the paginated interface list
     */
    @GetMapping("/configuration/search")
    ResponseEntity<Page<InterfaceDTO>> findByCriteria(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String protocol,
            @RequestParam(required = false) InterfaceStatus status,
            @RequestParam(required = false) String sort);

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
     * @param fromDate      optional start instant, ISO-8601 with offset (inclusive)
     * @param toDate        optional end instant, ISO-8601 with offset (exclusive)
     * @param operationType filter by operation type (IN, OUT)
     * @param interfaceName filter by interface name (partial match)
     * @param status        filter by log status (SUCCESS, ERROR)
     * @return 200 OK with paginated interface log list
     */
    @GetMapping("/monitor")
    ResponseEntity<Page<InterfaceLogDTO>> findLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime toDate,
            @RequestParam(required = false) InterfaceOperationType operationType,
            @RequestParam(required = false) String interfaceName,
            @RequestParam(required = false) InterfaceLogStatus status,
            @RequestParam(required = false) String sort);

    /**
     * Counts interface operation logs matching the given filters.
     *
     * @param fromDate      optional start instant, ISO-8601 with offset (inclusive)
     * @param toDate        optional end instant, ISO-8601 with offset (exclusive)
     * @param operationType filter by operation type (IN, OUT)
     * @param interfaceName filter by interface name (partial match)
     * @param status        filter by log status (SUCCESS, ERROR)
     * @return 200 OK with the total count
     */
    @GetMapping("/monitor/count")
    ResponseEntity<Long> countLogs(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime toDate,
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
