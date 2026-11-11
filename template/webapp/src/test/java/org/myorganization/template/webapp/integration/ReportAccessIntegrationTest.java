package org.myorganization.template.webapp.integration;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.myorganization.template.core.repository.ReportRepository;
import org.myorganization.template.core.repository.User2ReportRepository;
import org.myorganization.template.core.repository.UserRepository;
import org.myorganization.template.domain.entity.Report;
import org.myorganization.template.domain.entity.User;
import org.myorganization.template.domain.entity.User2Report;
import org.myorganization.template.webapp.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration test for the report access control (SEC-08) against the real Spring
 * Security configuration and service layer.
 *
 * <p>
 * Reading the report module/catalog ({@code GET /api/v1/reports} and
 * {@code /api/v1/reports/**}) requires {@code REPORT_READ}, while executing or
 * exporting ({@code POST}) requires {@code REPORT_EXECUTE}. In addition the
 * filter definitions endpoint validates that the report is assigned to the
 * authenticated user, so a user cannot enumerate reports that were not granted
 * to them.
 * </p>
 *
 * <p>
 * Uses a real PostgreSQL database via Testcontainers and the seeded admin user
 * (username {@code admin}, id 1000) as the token subject so the controller can
 * resolve the authenticated user.
 * </p>
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers
@ActiveProfiles("test")
class ReportAccessIntegrationTest {

    /** Seeded admin user attached to the full-access profile. */
    private static final long ADMIN_USER_ID = 1000L;

    @Container
    @SuppressWarnings("resource") // closed by the Testcontainers extension via @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:18-alpine")
            .withInitScript("db/test-init-schema.sql")
            .withDatabaseName("template_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
        registry.add("spring.liquibase.enabled", () -> "true");
        registry.add("spring.liquibase.change-log", () -> "classpath:db/changelog/db.changelog-test.xml");
        registry.add("spring.liquibase.contexts", () -> "test");
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private User2ReportRepository user2ReportRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Generates a token whose subject is the seeded admin user, so the controller
     * can resolve the authenticated user id from the security context.
     */
    private String adminToken(String... authorities) {
        return jwtTokenProvider.generateAccessToken("admin", "TestProfile", List.of(authorities));
    }

    // --- Catalog (REPORT_READ) ---

    @Test
    void getAllReports_withoutReportRead_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/reports/all")
                        .header("Authorization", "Bearer " + adminToken("REPORT_EXECUTE")))
                .andExpect(status().isForbidden());
    }

    @Test
    void getAllReports_withReportRead_returns200() throws Exception {
        mockMvc.perform(get("/api/v1/reports/all")
                        .header("Authorization", "Bearer " + adminToken("REPORT_READ")))
                .andExpect(status().isOk());
    }

    @Test
    void searchReports_withoutReportRead_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/reports/search")
                        .header("Authorization", "Bearer " + adminToken("REPORT_EXECUTE"))
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isForbidden());
    }

    @Test
    void searchReports_withReportRead_returns200() throws Exception {
        mockMvc.perform(get("/api/v1/reports/search")
                        .header("Authorization", "Bearer " + adminToken("REPORT_READ"))
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk());
    }

    // --- Filters (report must be assigned) ---

    @Test
    void getFilters_withReportReadButNotAssigned_returns403() throws Exception {
        Report report = createReport("SEC-08 not assigned");

        mockMvc.perform(get("/api/v1/reports/" + report.getId() + "/filters")
                        .header("Authorization", "Bearer " + adminToken("REPORT_READ")))
                .andExpect(status().isForbidden());
    }

    @Test
    void getFilters_withReportReadAndAssigned_returns200() throws Exception {
        Report report = createReport("SEC-08 assigned");
        assignToAdmin(report);

        mockMvc.perform(get("/api/v1/reports/" + report.getId() + "/filters")
                        .header("Authorization", "Bearer " + adminToken("REPORT_READ")))
                .andExpect(status().isOk());
    }

    // --- Execution (REPORT_EXECUTE) ---

    @Test
    void executeReport_withOnlyReportRead_returns403() throws Exception {
        Report report = createReport("SEC-08 execute read-only");

        mockMvc.perform(post("/api/v1/reports/" + report.getId() + "/execute")
                        .header("Authorization", "Bearer " + adminToken("REPORT_READ"))
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isForbidden());
    }

    @Test
    void executeReport_withReportExecuteButNotAssigned_returns403() throws Exception {
        Report report = createReport("SEC-08 execute not assigned");

        mockMvc.perform(post("/api/v1/reports/" + report.getId() + "/execute")
                        .header("Authorization", "Bearer " + adminToken("REPORT_EXECUTE"))
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isForbidden());
    }

    @Test
    void executeReport_withReportExecuteAndAssigned_returns200() throws Exception {
        Report report = createReport("SEC-08 execute assigned");
        assignToAdmin(report);

        mockMvc.perform(post("/api/v1/reports/" + report.getId() + "/execute")
                        .header("Authorization", "Bearer " + adminToken("REPORT_EXECUTE"))
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk());
    }

    private Report createReport(String name) {
        Report report = new Report();
        report.setName(name);
        report.setDescription("Report created by ReportAccessIntegrationTest");
        return reportRepository.save(report);
    }

    private void assignToAdmin(Report report) {
        User admin = userRepository.getReferenceById(ADMIN_USER_ID);
        user2ReportRepository.save(new User2Report(admin, report));
    }
}
