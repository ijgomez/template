package org.myorganization.template.webapp.controller;

import java.util.List;
import java.util.Map;

import org.myorganization.template.core.service.ReportService;
import org.myorganization.template.core.service.UserService;
import org.myorganization.template.domain.dto.ReportDTO;
import org.myorganization.template.domain.dto.ReportFilterDTO;
import org.myorganization.template.domain.dto.UserDTO;
import org.myorganization.template.domain.enums.ExportFormat;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for report operations.
 * <p>
 * Exposes endpoints for listing user-assigned reports, retrieving filter definitions,
 * executing reports with pagination, and exporting reports in multiple formats.
 * All operations are scoped to the authenticated user.
 */
@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {

    private final ReportService reportService;
    private final UserService userService;

    public ReportController(ReportService reportService, UserService userService) {
        this.reportService = reportService;
        this.userService = userService;
    }

    /**
     * Lists reports assigned to the authenticated user.
     *
     * @return 200 OK with the list of reports assigned to the user
     */
    @GetMapping
    public ResponseEntity<List<ReportDTO>> findByUser() {
        Long userId = getAuthenticatedUserId();
        List<ReportDTO> reports = reportService.findByUser(userId);
        return ResponseEntity.ok(reports);
    }

    /**
     * Lists all available reports in the system.
     * Used by the admin UI to assign reports to users.
     *
     * @return 200 OK with the list of all reports
     */
    @GetMapping("/all")
    public ResponseEntity<List<ReportDTO>> findAll() {
        List<ReportDTO> reports = reportService.findAll();
        return ResponseEntity.ok(reports);
    }

    /**
     * Lists all reports with server-side pagination and optional name filter.
     * Used by selection modals that need paginated results.
     *
     * @param name     optional partial name filter
     * @param pageable pagination parameters (page, size, sort)
     * @return 200 OK with paginated report results
     */
    @GetMapping("/search")
    public ResponseEntity<Page<ReportDTO>> search(
            @RequestParam(required = false) String name,
            Pageable pageable) {
        Page<ReportDTO> page = reportService.findAll(name, pageable);
        return ResponseEntity.ok(page);
    }

    /**
     * Retrieves filter definitions for a given report.
     *
     * @param id the report identifier
     * @return 200 OK with the list of filter definitions
     */
    @GetMapping("/{id}/filters")
    public ResponseEntity<List<ReportFilterDTO>> getFilters(@PathVariable Long id) {
        List<ReportFilterDTO> filters = reportService.getFilters(id);
        return ResponseEntity.ok(filters);
    }

    /**
     * Executes a report with the given filters and returns paginated results.
     *
     * @param id       the report identifier
     * @param filters  the filter values as key-value pairs
     * @param pageable pagination parameters (page, size, sort)
     * @return 200 OK with paginated report results
     */
    @PostMapping("/{id}/execute")
    public ResponseEntity<Page<Map<String, Object>>> execute(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> filters,
            Pageable pageable) {

        Long userId = getAuthenticatedUserId();
        Map<String, Object> safeFilters = filters != null ? filters : Map.of();
        Page<Map<String, Object>> results = reportService.execute(id, userId, safeFilters, pageable);
        return ResponseEntity.ok(results);
    }

    /**
     * Exports a report in the specified format.
     * <p>
     * Returns the file as a byte array with appropriate Content-Type and
     * Content-Disposition headers for download.
     *
     * @param id      the report identifier
     * @param format  the export format (PDF, XLSX, CSV, TXT)
     * @param filters the filter values as key-value pairs
     * @return 200 OK with the exported file content
     */
    @PostMapping("/{id}/export/{format}")
    public ResponseEntity<byte[]> export(
            @PathVariable Long id,
            @PathVariable ExportFormat format,
            @RequestBody(required = false) Map<String, Object> filters) {

        Long userId = getAuthenticatedUserId();
        Map<String, Object> safeFilters = filters != null ? filters : Map.of();
        byte[] content = reportService.export(id, userId, safeFilters, format);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(getMediaType(format));
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename("report_" + id + "." + format.name().toLowerCase())
                .build());

        return ResponseEntity.ok()
                .headers(headers)
                .body(content);
    }

    /**
     * Resolves the appropriate Content-Type for the given export format.
     *
     * @param format the export format
     * @return the corresponding MediaType
     */
    private MediaType getMediaType(ExportFormat format) {
        return switch (format) {
            case PDF -> MediaType.APPLICATION_PDF;
            case XLSX -> MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            case CSV -> MediaType.parseMediaType("text/csv");
            case TXT -> MediaType.TEXT_PLAIN;
        };
    }

    /**
     * Extracts the authenticated user's ID from the Spring Security context.
     *
     * @return the authenticated user's identifier
     */
    private Long getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        UserDTO user = userService.findByUsername(username);
        return user.id();
    }

}
