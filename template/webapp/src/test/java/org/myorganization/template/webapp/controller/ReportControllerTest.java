package org.myorganization.template.webapp.controller;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.myorganization.template.core.service.ReportService;
import org.myorganization.template.core.service.UserService;
import org.myorganization.template.domain.dto.ReportDTO;
import org.myorganization.template.domain.dto.ReportFilterDTO;
import org.myorganization.template.domain.dto.UserDTO;
import org.myorganization.template.domain.enums.ExportFormat;
import org.myorganization.template.domain.exception.AccessDeniedException;
import org.myorganization.template.domain.exception.EntityNotFoundException;
import org.myorganization.template.domain.exception.ValidationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link ReportController}.
 */
class ReportControllerTest {

    private ReportService reportService;
    private UserService userService;
    private ReportController reportController;

    @BeforeEach
    void setUp() {
        reportService = mock(ReportService.class);
        userService = mock(UserService.class);
        reportController = new ReportController(reportService, userService);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("findByUser: returns list of reports assigned to authenticated user")
    void findByUser_shouldReturnUserReports() {
        setAuthenticatedUser("testuser");
        mockUserLookup("testuser", 1L);

        List<ReportDTO> reports = List.of(
                new ReportDTO(1L, "Sales Report", "Monthly sales", OffsetDateTime.now(), OffsetDateTime.now()),
                new ReportDTO(2L, "Inventory Report", "Stock levels", OffsetDateTime.now(), OffsetDateTime.now())
        );
        when(reportService.findByUser(1L)).thenReturn(reports);

        ResponseEntity<List<ReportDTO>> response = reportController.findByUser();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody()).hasSize(2);
        assertThat(response.getBody().get(0).name()).isEqualTo("Sales Report");
        verify(reportService).findByUser(1L);
    }

    @Test
    @DisplayName("findByUser: returns empty list when no reports assigned")
    void findByUser_noReports_shouldReturnEmptyList() {
        setAuthenticatedUser("testuser");
        mockUserLookup("testuser", 1L);
        when(reportService.findByUser(1L)).thenReturn(List.of());

        ResponseEntity<List<ReportDTO>> response = reportController.findByUser();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody()).isEmpty();
    }

    @Test
    @DisplayName("getFilters: returns filter definitions for a report")
    void getFilters_shouldReturnFilterDefinitions() {
        List<ReportFilterDTO> filters = List.of(
                new ReportFilterDTO("startDate", "DATE", true),
                new ReportFilterDTO("category", "STRING", false)
        );
        when(reportService.getFilters(1L)).thenReturn(filters);

        ResponseEntity<List<ReportFilterDTO>> response = reportController.getFilters(1L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody()).hasSize(2);
        assertThat(response.getBody().get(0).name()).isEqualTo("startDate");
        assertThat(response.getBody().get(0).required()).isTrue();
    }

    @Test
    @DisplayName("getFilters: throws EntityNotFoundException when report does not exist")
    void getFilters_reportNotFound_shouldThrowEntityNotFoundException() {
        when(reportService.getFilters(99L)).thenThrow(new EntityNotFoundException("Report", 99L));

        assertThatThrownBy(() -> reportController.getFilters(99L))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    @DisplayName("execute: returns paginated results for a report")
    void execute_shouldReturnPaginatedResults() {
        setAuthenticatedUser("testuser");
        mockUserLookup("testuser", 1L);

        Pageable pageable = PageRequest.of(0, 10);
        Map<String, Object> filters = Map.of("startDate", "2024-01-01");
        List<Map<String, Object>> content = List.of(
                Map.of("id", 1, "name", "Item A"),
                Map.of("id", 2, "name", "Item B")
        );
        Page<Map<String, Object>> page = new PageImpl<>(content, pageable, 2);
        when(reportService.execute(eq(1L), eq(1L), eq(filters), eq(pageable))).thenReturn(page);

        ResponseEntity<Page<Map<String, Object>>> response = reportController.execute(1L, filters, pageable);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getContent()).hasSize(2);
        verify(reportService).execute(1L, 1L, filters, pageable);
    }

    @Test
    @DisplayName("execute: handles null filters as empty map")
    void execute_nullFilters_shouldUseEmptyMap() {
        setAuthenticatedUser("testuser");
        mockUserLookup("testuser", 1L);

        Pageable pageable = PageRequest.of(0, 10);
        Page<Map<String, Object>> page = new PageImpl<>(List.of(), pageable, 0);
        when(reportService.execute(eq(1L), eq(1L), eq(Map.of()), eq(pageable))).thenReturn(page);

        ResponseEntity<Page<Map<String, Object>>> response = reportController.execute(1L, null, pageable);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(reportService).execute(1L, 1L, Map.of(), pageable);
    }

    @Test
    @DisplayName("execute: throws AccessDeniedException when user has no access to report")
    void execute_noAccess_shouldThrowAccessDeniedException() {
        setAuthenticatedUser("testuser");
        mockUserLookup("testuser", 1L);

        Pageable pageable = PageRequest.of(0, 10);
        when(reportService.execute(eq(5L), eq(1L), any(), any()))
                .thenThrow(new AccessDeniedException("User does not have access to report with id: 5"));

        assertThatThrownBy(() -> reportController.execute(5L, Map.of(), pageable))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("execute: throws ValidationException when mandatory filters are missing")
    void execute_missingMandatoryFilters_shouldThrowValidationException() {
        setAuthenticatedUser("testuser");
        mockUserLookup("testuser", 1L);

        Pageable pageable = PageRequest.of(0, 10);
        when(reportService.execute(eq(1L), eq(1L), any(), any()))
                .thenThrow(new ValidationException("Missing mandatory filters: startDate"));

        assertThatThrownBy(() -> reportController.execute(1L, Map.of(), pageable))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("startDate");
    }

    @Test
    @DisplayName("export CSV: returns byte[] with text/csv content type")
    void export_csv_shouldReturnCsvContent() {
        setAuthenticatedUser("testuser");
        mockUserLookup("testuser", 1L);

        byte[] csvContent = "id,name\n1,Test\n".getBytes();
        when(reportService.export(eq(1L), eq(1L), eq(Map.of()), eq(ExportFormat.CSV))).thenReturn(csvContent);

        ResponseEntity<byte[]> response = reportController.export(1L, ExportFormat.CSV, Map.of());

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isEqualTo(csvContent);
        assertThat(response.getHeaders().getContentType()).isEqualTo(MediaType.parseMediaType("text/csv"));
        assertThat(response.getHeaders().getContentDisposition().getFilename()).isEqualTo("report_1.csv");
    }

    @Test
    @DisplayName("export TXT: returns byte[] with text/plain content type")
    void export_txt_shouldReturnTxtContent() {
        setAuthenticatedUser("testuser");
        mockUserLookup("testuser", 1L);

        byte[] txtContent = "Report: Test\n".getBytes();
        when(reportService.export(eq(1L), eq(1L), eq(Map.of()), eq(ExportFormat.TXT))).thenReturn(txtContent);

        ResponseEntity<byte[]> response = reportController.export(1L, ExportFormat.TXT, Map.of());

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isEqualTo(txtContent);
        assertThat(response.getHeaders().getContentType()).isEqualTo(MediaType.TEXT_PLAIN);
        assertThat(response.getHeaders().getContentDisposition().getFilename()).isEqualTo("report_1.txt");
    }

    @Test
    @DisplayName("export PDF: returns byte[] with application/pdf content type")
    void export_pdf_shouldReturnPdfContent() {
        setAuthenticatedUser("testuser");
        mockUserLookup("testuser", 1L);

        byte[] pdfContent = new byte[]{0x25, 0x50, 0x44, 0x46}; // %PDF
        when(reportService.export(eq(1L), eq(1L), eq(Map.of()), eq(ExportFormat.PDF))).thenReturn(pdfContent);

        ResponseEntity<byte[]> response = reportController.export(1L, ExportFormat.PDF, Map.of());

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isEqualTo(pdfContent);
        assertThat(response.getHeaders().getContentType()).isEqualTo(MediaType.APPLICATION_PDF);
        assertThat(response.getHeaders().getContentDisposition().getFilename()).isEqualTo("report_1.pdf");
    }

    @Test
    @DisplayName("export XLSX: returns byte[] with openxmlformats content type")
    void export_xlsx_shouldReturnXlsxContent() {
        setAuthenticatedUser("testuser");
        mockUserLookup("testuser", 1L);

        byte[] xlsxContent = new byte[]{0x50, 0x4B, 0x03, 0x04}; // PK zip header
        when(reportService.export(eq(1L), eq(1L), eq(Map.of()), eq(ExportFormat.XLSX))).thenReturn(xlsxContent);

        ResponseEntity<byte[]> response = reportController.export(1L, ExportFormat.XLSX, Map.of());

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isEqualTo(xlsxContent);
        assertThat(response.getHeaders().getContentType())
                .isEqualTo(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        assertThat(response.getHeaders().getContentDisposition().getFilename()).isEqualTo("report_1.xlsx");
    }

    @Test
    @DisplayName("export: handles null filters as empty map")
    void export_nullFilters_shouldUseEmptyMap() {
        setAuthenticatedUser("testuser");
        mockUserLookup("testuser", 1L);

        byte[] content = "data".getBytes();
        when(reportService.export(eq(1L), eq(1L), eq(Map.of()), eq(ExportFormat.TXT))).thenReturn(content);

        ResponseEntity<byte[]> response = reportController.export(1L, ExportFormat.TXT, null);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(reportService).export(1L, 1L, Map.of(), ExportFormat.TXT);
    }

    @Test
    @DisplayName("export: throws AccessDeniedException when user has no access")
    void export_noAccess_shouldThrowAccessDeniedException() {
        setAuthenticatedUser("testuser");
        mockUserLookup("testuser", 1L);

        when(reportService.export(eq(5L), eq(1L), any(), any()))
                .thenThrow(new AccessDeniedException("User does not have access to report with id: 5"));

        assertThatThrownBy(() -> reportController.export(5L, ExportFormat.CSV, Map.of()))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("export: Content-Disposition header is set to attachment")
    void export_shouldSetContentDispositionAttachment() {
        setAuthenticatedUser("testuser");
        mockUserLookup("testuser", 1L);

        byte[] content = "data".getBytes();
        when(reportService.export(eq(2L), eq(1L), eq(Map.of()), eq(ExportFormat.CSV))).thenReturn(content);

        ResponseEntity<byte[]> response = reportController.export(2L, ExportFormat.CSV, Map.of());

        assertThat(response.getHeaders().getContentDisposition().isAttachment()).isTrue();
        assertThat(response.getHeaders().getContentDisposition().getFilename()).isEqualTo("report_2.csv");
    }

    private void setAuthenticatedUser(String username) {
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(username, null, List.of());
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private void mockUserLookup(String username, Long userId) {
        UserDTO user = new UserDTO(userId, username, null, "Test", "User", "test@mail.com",
                null, 1L, "Admin", List.of(), OffsetDateTime.now(), OffsetDateTime.now());
        when(userService.findByUsername(username)).thenReturn(user);
    }

}
