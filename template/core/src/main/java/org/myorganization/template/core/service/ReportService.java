package org.myorganization.template.core.service;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.myorganization.template.core.repository.ReportRepository;
import org.myorganization.template.core.repository.User2ReportRepository;
import org.myorganization.template.domain.dto.ReportDTO;
import org.myorganization.template.domain.dto.ReportFilterDTO;
import org.myorganization.template.domain.entity.Report;
import org.myorganization.template.domain.entity.User2Report;
import org.myorganization.template.domain.enums.ExportFormat;
import org.myorganization.template.domain.exception.AccessDeniedException;
import org.myorganization.template.domain.exception.EntityNotFoundException;
import org.myorganization.template.domain.exception.ReportExportException;
import org.myorganization.template.domain.exception.ValidationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for managing report execution and export.
 * <p>
 * Provides methods to list user-assigned reports, retrieve filter definitions,
 * execute reports with server-side pagination, and export reports in multiple formats.
 * <p>
 * This is a framework/template implementation. Real report execution logic is data-driven
 * and should be extended per project needs.
 */
@Service
@Transactional(readOnly = true)
public class ReportService {

    private final ReportRepository reportRepository;
    private final User2ReportRepository user2ReportRepository;

    public ReportService(ReportRepository reportRepository, User2ReportRepository user2ReportRepository) {
        this.reportRepository = reportRepository;
        this.user2ReportRepository = user2ReportRepository;
    }

    /**
     * Lists all reports assigned to a given user via the user2report table.
     *
     * @param userId the user identifier
     * @return list of reports assigned to the user
     */
    public List<ReportDTO> findByUser(Long userId) {
        List<User2Report> associations = user2ReportRepository.findByIdUserId(userId);
        return associations.stream()
                .map(User2Report::getReport)
                .map(this::toDTO)
                .toList();
    }

    /**
     * Returns the filter definitions for a given report.
     * <p>
     * This is a placeholder implementation that returns an empty list.
     * Real implementations would query a report_filter table or external configuration.
     *
     * @param reportId the report identifier
     * @return list of filter definitions for the report
     * @throws EntityNotFoundException if the report does not exist
     */
    public List<ReportFilterDTO> getFilters(Long reportId) {
        if (!reportRepository.existsById(reportId)) {
            throw new EntityNotFoundException("Report", reportId);
        }
        // Placeholder: real implementations would query report filter definitions
        return List.of();
    }

    /**
     * Executes a report with server-side pagination.
     * <p>
     * Validates that the user has the report assigned and that all mandatory filters are present.
     * Returns paginated results as a list of key-value maps.
     * <p>
     * This is a placeholder implementation that returns dummy data.
     *
     * @param reportId the report identifier
     * @param userId   the user requesting execution
     * @param filters  the filter values provided by the user
     * @param pageable pagination information
     * @return paginated report results
     * @throws EntityNotFoundException if the report does not exist
     * @throws AccessDeniedException   if the user does not have the report assigned
     * @throws ValidationException     if mandatory filters are missing
     */
    public Page<Map<String, Object>> execute(Long reportId, Long userId, Map<String, Object> filters, Pageable pageable) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new EntityNotFoundException("Report", reportId));

        validateUserAccess(userId, reportId);
        validateMandatoryFilters(reportId, filters);

        // Placeholder: return dummy paginated data
        List<Map<String, Object>> content = generatePlaceholderData(report, pageable);
        return new PageImpl<>(content, pageable, content.size());
    }

    /**
     * Exports a report in the specified format.
     * <p>
     * Validates that the user has the report assigned and that all mandatory filters are present.
     * Supports CSV and TXT formats. PDF and XLSX throw ReportExportException (not yet implemented).
     *
     * @param reportId the report identifier
     * @param userId   the user requesting export
     * @param filters  the filter values provided by the user
     * @param format   the export format (PDF, XLSX, CSV, TXT)
     * @return byte array of the exported file content
     * @throws EntityNotFoundException if the report does not exist
     * @throws AccessDeniedException   if the user does not have the report assigned
     * @throws ValidationException     if mandatory filters are missing
     * @throws ReportExportException   if the export format is not supported or export fails
     */
    public byte[] export(Long reportId, Long userId, Map<String, Object> filters, ExportFormat format) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new EntityNotFoundException("Report", reportId));

        validateUserAccess(userId, reportId);
        validateMandatoryFilters(reportId, filters);

        return switch (format) {
            case CSV -> exportCsv(report);
            case TXT -> exportTxt(report);
            case PDF -> throw new ReportExportException("Export format PDF not yet implemented");
            case XLSX -> throw new ReportExportException("Export format XLSX not yet implemented");
        };
    }

    /**
     * Validates that the user has the report assigned via user2report.
     *
     * @param userId   the user identifier
     * @param reportId the report identifier
     * @throws AccessDeniedException if the user does not have the report assigned
     */
    void validateUserAccess(Long userId, Long reportId) {
        List<User2Report> associations = user2ReportRepository.findByIdUserId(userId);
        boolean hasAccess = associations.stream()
                .anyMatch(ur -> ur.getReport().getId().equals(reportId));

        if (!hasAccess) {
            throw new AccessDeniedException("User does not have access to report with id: " + reportId);
        }
    }

    /**
     * Validates that all mandatory filters for a report are present in the provided filter map.
     *
     * @param reportId the report identifier
     * @param filters  the filter values provided by the user
     * @throws ValidationException if one or more mandatory filters are missing
     */
    void validateMandatoryFilters(Long reportId, Map<String, Object> filters) {
        List<ReportFilterDTO> filterDefs = getFilters(reportId);
        List<String> missingFilters = filterDefs.stream()
                .filter(ReportFilterDTO::required)
                .map(ReportFilterDTO::name)
                .filter(name -> filters == null || !filters.containsKey(name) || filters.get(name) == null)
                .toList();

        if (!missingFilters.isEmpty()) {
            throw new ValidationException("Missing mandatory filters: " + String.join(", ", missingFilters));
        }
    }

    private byte[] exportCsv(Report report) {
        StringBuilder sb = new StringBuilder();
        sb.append("id,name,description\n");
        sb.append(report.getId()).append(",")
                .append(escapeCsv(report.getName())).append(",")
                .append(escapeCsv(report.getDescription() != null ? report.getDescription() : ""))
                .append("\n");
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private byte[] exportTxt(Report report) {
        StringBuilder sb = new StringBuilder();
        sb.append("Report: ").append(report.getName()).append("\n");
        sb.append("Description: ").append(report.getDescription() != null ? report.getDescription() : "N/A").append("\n");
        sb.append("---\n");
        sb.append("No data available (placeholder implementation)\n");
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String escapeCsv(String value) {
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    private List<Map<String, Object>> generatePlaceholderData(Report report, Pageable pageable) {
        List<Map<String, Object>> data = new ArrayList<>();
        Map<String, Object> row = new HashMap<>();
        row.put("id", report.getId());
        row.put("name", report.getName());
        row.put("description", report.getDescription());
        data.add(row);
        return data;
    }

    private ReportDTO toDTO(Report entity) {
        return new ReportDTO(
                entity.getId(),
                entity.getName(),
                entity.getDescription(),
                entity.getCreatedAt(),
                entity.getLastModifiedAt()
        );
    }
}
