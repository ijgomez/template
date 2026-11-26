package org.myorganization.template.webapp.integration;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;

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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * SEC-19: {@code %}, {@code _} and {@code \} in text filters are matched literally instead of
 * acting as {@code LIKE} wildcards. Uses the audit {@code username} filter against a real
 * PostgreSQL database (Testcontainers); all list filters share {@code LikePatterns}.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers
@ActiveProfiles("test")
class LikeWildcardIntegrationTest {

    private static final String AUDIT_COUNT_URL = "/api/v1/administration/audit/count";
    private static final Set<String> USERNAMES = Set.of("like_a%b", "likeXaYb", "like\\c");

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
    void seed() {
        auditLogRepository.saveAll(USERNAMES.stream().map(LikeWildcardIntegrationTest::auditLog).toList());
    }

    @AfterEach
    void cleanUp() {
        auditLogRepository.deleteAll(auditLogRepository.findAll().stream()
                .filter(log -> USERNAMES.contains(log.getUsername()))
                .toList());
    }

    @Test
    void percentSign_isMatchedLiterally() throws Exception {
        assertCount("%", 1);
    }

    @Test
    void underscore_isMatchedLiterally() throws Exception {
        // unescaped, "like_a" would also match "likeXaYb"
        assertCount("like_a", 1);
    }

    @Test
    void backslash_isMatchedLiterally() throws Exception {
        assertCount("like\\c", 1);
    }

    @Test
    void regularText_stillMatchesAsContains() throws Exception {
        assertCount("LIKE", 3);
    }

    private void assertCount(String username, int expected) throws Exception {
        mockMvc.perform(get(AUDIT_COUNT_URL)
                        .param("username", username)
                        .header("Authorization", "Bearer " + token()))
                .andExpect(status().isOk())
                .andExpect(content().string(String.valueOf(expected)));
    }

    private String token() {
        return jwtTokenProvider.generateAccessToken("audituser", "TestProfile", List.of("SYSTEM_LOG_READ"));
    }

    private static AuditLog auditLog(String username) {
        AuditLog log = new AuditLog();
        log.setTimestamp(OffsetDateTime.now());
        log.setUsername(username);
        log.setOperationType(OperationType.EXECUTE);
        log.setSection(AuditSection.REPORTS);
        log.setEntityName("sec-19");
        return log;
    }
}
