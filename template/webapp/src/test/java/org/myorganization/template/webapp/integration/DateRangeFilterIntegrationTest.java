package org.myorganization.template.webapp.integration;

import java.time.OffsetDateTime;
import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.myorganization.template.core.repository.AuditLogRepository;
import org.myorganization.template.domain.entity.AuditLog;
import org.myorganization.template.domain.enums.AuditSection;
import org.myorganization.template.domain.enums.OperationType;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration test for UTC date-range filters on list endpoints.
 *
 * <p>
 * The dashboard converts the local day chosen by the user (browser time zone) into a
 * half-open UTC range {@code [fromDate, toDate)}. This test uses the DST change day
 * 2026-10-25 in Europe/Madrid, which lasts 25 hours: from {@code 2026-10-24T22:00:00Z}
 * (00:00 CEST) to {@code 2026-10-25T23:00:00Z} (00:00 CET of the next day).
 * </p>
 *
 * <p>
 * Uses a real PostgreSQL database via Testcontainers.
 * </p>
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers
@ActiveProfiles("test")
class DateRangeFilterIntegrationTest {

    private static final String AUDIT_URL = "/api/v1/administration/audit";
    private static final String TEST_USERNAME = "dst-range-user";
    private static final String DAY_START_UTC = "2026-10-24T22:00:00.000Z";
    private static final String NEXT_DAY_START_UTC = "2026-10-25T23:00:00.000Z";

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
    private AuditLogRepository auditLogRepository;

    @BeforeEach
    void seedAuditLogsAroundLocalDayBoundaries() {
        // given: two entries just outside and two just inside the local day (Europe/Madrid)
        auditLogRepository.saveAll(List.of(
                auditLog("2026-10-24T21:59:59Z", "before"),   // 24/10 23:59:59 CEST
                auditLog("2026-10-24T22:00:00Z", "first"),    // 25/10 00:00:00 CEST
                auditLog("2026-10-25T22:59:59Z", "last"),     // 25/10 23:59:59 CET
                auditLog("2026-10-25T23:00:00Z", "after")));  // 26/10 00:00:00 CET
    }

    @AfterEach
    void cleanUp() {
        auditLogRepository.deleteAll(auditLogRepository.findAll().stream()
                .filter(log -> TEST_USERNAME.equals(log.getUsername()))
                .toList());
    }

    @Test
    void count_withUtcRangeOfLocalDstDay_includesStartAndExcludesEnd() throws Exception {
        // when / then
        mockMvc.perform(get(AUDIT_URL + "/count")
                        .param("fromDate", DAY_START_UTC)
                        .param("toDate", NEXT_DAY_START_UTC)
                        .param("username", TEST_USERNAME)
                        .header("Authorization", "Bearer " + token()))
                .andExpect(status().isOk())
                .andExpect(content().string("2"));
    }

    @Test
    void findAll_withUtcRangeOfLocalDstDay_returnsOnlyEntriesOfThatLocalDay() throws Exception {
        // when / then
        mockMvc.perform(get(AUDIT_URL)
                        .param("fromDate", DAY_START_UTC)
                        .param("toDate", NEXT_DAY_START_UTC)
                        .param("username", TEST_USERNAME)
                        .param("sort", "timestamp,asc")
                        .header("Authorization", "Bearer " + token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.content[0].entityName").value("first"))
                .andExpect(jsonPath("$.content[1].entityName").value("last"));
    }

    @Test
    void count_withDateOnlyValue_returns400() throws Exception {
        // when / then: plain dates are ambiguous (no time zone) and must be rejected
        mockMvc.perform(get(AUDIT_URL + "/count")
                        .param("fromDate", "2026-10-25")
                        .header("Authorization", "Bearer " + token()))
                .andExpect(status().isBadRequest());
    }

    private String token() {
        return jwtTokenProvider.generateAccessToken("audituser", "TestProfile", List.of("SYSTEM_LOG_READ"));
    }

    private static AuditLog auditLog(String utcInstant, String entityName) {
        AuditLog log = new AuditLog();
        log.setTimestamp(OffsetDateTime.parse(utcInstant));
        log.setUsername(TEST_USERNAME);
        log.setOperationType(OperationType.EXECUTE);
        log.setSection(AuditSection.REPORTS);
        log.setEntityName(entityName);
        return log;
    }
}
