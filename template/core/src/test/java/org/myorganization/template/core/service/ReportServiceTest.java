package org.myorganization.template.core.service;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.myorganization.template.core.repository.ReportRepository;
import org.myorganization.template.core.repository.User2ReportRepository;
import org.myorganization.template.domain.dto.ReportDTO;
import org.myorganization.template.domain.entity.Report;
import org.myorganization.template.domain.entity.User;
import org.myorganization.template.domain.entity.User2Report;
import org.myorganization.template.domain.enums.ExportFormat;
import org.myorganization.template.domain.exception.AccessDeniedException;
import org.myorganization.template.domain.exception.EntityNotFoundException;
import org.myorganization.template.domain.exception.ReportExportException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock
    private ReportRepository reportRepository;

    @Mock
    private User2ReportRepository user2ReportRepository;

    private ReportService reportService;

    @BeforeEach
    void setUp() {
        reportService = new ReportService(reportRepository, user2ReportRepository);
    }

    @Test
    @DisplayName("findByUser: returns reports assigned to user")
    void findByUser_returnsAssignedReports() {
        Long userId = 1L;
        Report report1 = createReport(10L, "Sales Report", "Monthly sales");
        Report report2 = createReport(20L, "HR Report", "Employee data");

        User user = new User();
        user.setId(userId);

        User2Report ur1 = new User2Report(user, report1);
        User2Report ur2 = new User2Report(user, report2);

        when(user2ReportRepository.findByIdUserId(userId)).thenReturn(List.of(ur1, ur2));

        List<ReportDTO> result = reportService.findByUser(userId);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).id()).isEqualTo(10L);
        assertThat(result.get(0).name()).isEqualTo("Sales Report");
        assertThat(result.get(1).id()).isEqualTo(20L);
        assertThat(result.get(1).name()).isEqualTo("HR Report");
    }

    @Test
    @DisplayName("findByUser: returns empty list when user has no reports")
    void findByUser_noReports_returnsEmptyList() {
        Long userId = 1L;
        when(user2ReportRepository.findByIdUserId(userId)).thenReturn(Collections.emptyList());

        List<ReportDTO> result = reportService.findByUser(userId);

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("getFilters: existing report returns filter definitions (empty placeholder)")
    void getFilters_existingReport_returnsFilters() {
        Long reportId = 10L;
        when(reportRepository.existsById(reportId)).thenReturn(true);

        var filters = reportService.getFilters(reportId);

        assertThat(filters).isEmpty();
    }

    @Test
    @DisplayName("getFilters: non-existing report throws EntityNotFoundException")
    void getFilters_nonExistingReport_throwsEntityNotFoundException() {
        Long reportId = 999L;
        when(reportRepository.existsById(reportId)).thenReturn(false);

        assertThatThrownBy(() -> reportService.getFilters(reportId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Report")
                .hasMessageContaining("999");
    }

    @Test
    @DisplayName("execute: authorized user can execute report")
    void execute_authorizedUser_returnsResults() {
        Long reportId = 10L;
        Long userId = 1L;
        Report report = createReport(reportId, "Sales Report", "Monthly sales");
        User user = new User();
        user.setId(userId);
        User2Report ur = new User2Report(user, report);

        when(reportRepository.findById(reportId)).thenReturn(Optional.of(report));
        when(user2ReportRepository.findByIdUserId(userId)).thenReturn(List.of(ur));
        when(reportRepository.existsById(reportId)).thenReturn(true);

        Pageable pageable = PageRequest.of(0, 10);
        Map<String, Object> filters = new HashMap<>();

        Page<Map<String, Object>> result = reportService.execute(reportId, userId, filters, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).isNotEmpty();
    }

    @Test
    @DisplayName("execute: unauthorized user throws AccessDeniedException")
    void execute_unauthorizedUser_throwsAccessDeniedException() {
        Long reportId = 10L;
        Long userId = 1L;
        Report report = createReport(reportId, "Sales Report", "Monthly sales");

        when(reportRepository.findById(reportId)).thenReturn(Optional.of(report));
        when(user2ReportRepository.findByIdUserId(userId)).thenReturn(Collections.emptyList());

        Pageable pageable = PageRequest.of(0, 10);
        Map<String, Object> filters = new HashMap<>();

        assertThatThrownBy(() -> reportService.execute(reportId, userId, filters, pageable))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("does not have access");
    }

    @Test
    @DisplayName("execute: non-existing report throws EntityNotFoundException")
    void execute_nonExistingReport_throwsEntityNotFoundException() {
        Long reportId = 999L;
        Long userId = 1L;

        when(reportRepository.findById(reportId)).thenReturn(Optional.empty());

        Pageable pageable = PageRequest.of(0, 10);
        Map<String, Object> filters = new HashMap<>();

        assertThatThrownBy(() -> reportService.execute(reportId, userId, filters, pageable))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Report")
                .hasMessageContaining("999");
    }

    @Test
    @DisplayName("export CSV: authorized user gets byte array")
    void export_csv_authorizedUser_returnsByteArray() {
        Long reportId = 10L;
        Long userId = 1L;
        Report report = createReport(reportId, "Sales Report", "Monthly sales");
        User user = new User();
        user.setId(userId);
        User2Report ur = new User2Report(user, report);

        when(reportRepository.findById(reportId)).thenReturn(Optional.of(report));
        when(user2ReportRepository.findByIdUserId(userId)).thenReturn(List.of(ur));
        when(reportRepository.existsById(reportId)).thenReturn(true);

        Map<String, Object> filters = new HashMap<>();

        byte[] result = reportService.export(reportId, userId, filters, ExportFormat.CSV);

        assertThat(result).isNotNull();
        String csv = new String(result);
        assertThat(csv).contains("id,name,description");
        assertThat(csv).contains("Sales Report");
    }

    @Test
    @DisplayName("export TXT: authorized user gets byte array")
    void export_txt_authorizedUser_returnsByteArray() {
        Long reportId = 10L;
        Long userId = 1L;
        Report report = createReport(reportId, "Sales Report", "Monthly sales");
        User user = new User();
        user.setId(userId);
        User2Report ur = new User2Report(user, report);

        when(reportRepository.findById(reportId)).thenReturn(Optional.of(report));
        when(user2ReportRepository.findByIdUserId(userId)).thenReturn(List.of(ur));
        when(reportRepository.existsById(reportId)).thenReturn(true);

        Map<String, Object> filters = new HashMap<>();

        byte[] result = reportService.export(reportId, userId, filters, ExportFormat.TXT);

        assertThat(result).isNotNull();
        String txt = new String(result);
        assertThat(txt).contains("Report: Sales Report");
        assertThat(txt).contains("Description: Monthly sales");
    }

    @Test
    @DisplayName("export PDF: throws ReportExportException (not yet implemented)")
    void export_pdf_throwsReportExportException() {
        Long reportId = 10L;
        Long userId = 1L;
        Report report = createReport(reportId, "Sales Report", "Monthly sales");
        User user = new User();
        user.setId(userId);
        User2Report ur = new User2Report(user, report);

        when(reportRepository.findById(reportId)).thenReturn(Optional.of(report));
        when(user2ReportRepository.findByIdUserId(userId)).thenReturn(List.of(ur));
        when(reportRepository.existsById(reportId)).thenReturn(true);

        Map<String, Object> filters = new HashMap<>();

        assertThatThrownBy(() -> reportService.export(reportId, userId, filters, ExportFormat.PDF))
                .isInstanceOf(ReportExportException.class)
                .hasMessageContaining("not yet implemented");
    }

    @Test
    @DisplayName("export XLSX: throws ReportExportException (not yet implemented)")
    void export_xlsx_throwsReportExportException() {
        Long reportId = 10L;
        Long userId = 1L;
        Report report = createReport(reportId, "Sales Report", "Monthly sales");
        User user = new User();
        user.setId(userId);
        User2Report ur = new User2Report(user, report);

        when(reportRepository.findById(reportId)).thenReturn(Optional.of(report));
        when(user2ReportRepository.findByIdUserId(userId)).thenReturn(List.of(ur));
        when(reportRepository.existsById(reportId)).thenReturn(true);

        Map<String, Object> filters = new HashMap<>();

        assertThatThrownBy(() -> reportService.export(reportId, userId, filters, ExportFormat.XLSX))
                .isInstanceOf(ReportExportException.class)
                .hasMessageContaining("not yet implemented");
    }

    @Test
    @DisplayName("export: unauthorized user throws AccessDeniedException")
    void export_unauthorizedUser_throwsAccessDeniedException() {
        Long reportId = 10L;
        Long userId = 1L;
        Report report = createReport(reportId, "Sales Report", "Monthly sales");

        when(reportRepository.findById(reportId)).thenReturn(Optional.of(report));
        when(user2ReportRepository.findByIdUserId(userId)).thenReturn(Collections.emptyList());

        Map<String, Object> filters = new HashMap<>();

        assertThatThrownBy(() -> reportService.export(reportId, userId, filters, ExportFormat.CSV))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("does not have access");
    }

    @Test
    @DisplayName("validateUserAccess: user with report access does not throw")
    void validateUserAccess_userHasAccess_doesNotThrow() {
        Long userId = 1L;
        Long reportId = 10L;
        Report report = createReport(reportId, "Test", null);
        User user = new User();
        user.setId(userId);
        User2Report ur = new User2Report(user, report);

        when(user2ReportRepository.findByIdUserId(userId)).thenReturn(List.of(ur));

        // Should not throw
        reportService.validateUserAccess(userId, reportId);
    }

    @Test
    @DisplayName("validateUserAccess: user without report access throws AccessDeniedException")
    void validateUserAccess_userLacksAccess_throwsAccessDeniedException() {
        Long userId = 1L;
        Long reportId = 10L;

        when(user2ReportRepository.findByIdUserId(userId)).thenReturn(Collections.emptyList());

        assertThatThrownBy(() -> reportService.validateUserAccess(userId, reportId))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("does not have access")
                .hasMessageContaining("10");
    }

    private Report createReport(Long id, String name, String description) {
        Report report = new Report();
        report.setId(id);
        report.setName(name);
        report.setDescription(description);
        report.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        report.setLastModifiedAt(OffsetDateTime.now(ZoneOffset.UTC));
        return report;
    }
}
