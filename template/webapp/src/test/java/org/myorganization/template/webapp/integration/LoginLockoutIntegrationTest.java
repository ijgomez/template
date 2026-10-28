package org.myorganization.template.webapp.integration;

import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration test for the account lockout protection on {@code POST /api/v1/auth/login} (SEC-06).
 *
 * <p>Verifies against a real PostgreSQL database (Testcontainers) that consecutive failed
 * logins lock the account, that locked accounts are reported as 429 Too Many Requests with a
 * {@code Retry-After} header, and that a successful login clears the failure counter.</p>
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class LoginLockoutIntegrationTest {

    private static final String LOGIN_PATH = "/api/v1/auth/login";
    private static final String WRONG_PASSWORD_BODY = """
            {"username": "admin", "password": "wrong-password"}
            """;
    private static final String CORRECT_CREDENTIALS_BODY = """
            {"username": "admin", "password": "admin123"}
            """;

    private static final int MAX_ATTEMPTS = 3;

    @Container
    @SuppressWarnings("resource") // closed by the Testcontainers extension via @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:18-alpine")
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
        registry.add("auth.cookie.name", () -> "refresh-token");
        registry.add("auth.cookie.path", () -> "/template/api/v1/auth");
        registry.add("auth.cookie.secure", () -> "false");
        registry.add("auth.cookie.same-site", () -> "Lax");
        // Lower the lockout threshold so the test does not depend on the production default
        registry.add("auth.login-attempts.max-attempts", () -> Integer.toString(MAX_ATTEMPTS));
        registry.add("auth.login-attempts.lockout-minutes", () -> "15");
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @Order(1)
    void failedLoginsBelowThreshold_thenSuccessfulLogin_resetsCounter() throws Exception {
        for (int attempt = 1; attempt < MAX_ATTEMPTS; attempt++) {
            mockMvc.perform(post(LOGIN_PATH)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(WRONG_PASSWORD_BODY))
                    .andExpect(status().isUnauthorized());
        }

        assertThat(failedAttempts())
                .as("Failures below the threshold must be tracked")
                .isEqualTo(MAX_ATTEMPTS - 1);

        // A valid login clears the counter
        mockMvc.perform(post(LOGIN_PATH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(CORRECT_CREDENTIALS_BODY))
                .andExpect(status().isOk());

        assertThat(failedAttempts())
                .as("A successful login must reset the failure counter")
                .isZero();
        assertThat(lockedUntilIsSet())
                .as("A successful login must clear any lock")
                .isFalse();
    }

    @Test
    @Order(2)
    void reachingThreshold_locksAccount_andReturns429WithRetryAfter() throws Exception {
        // Each failed attempt is rejected with 401 until the lock is triggered
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            mockMvc.perform(post(LOGIN_PATH)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(WRONG_PASSWORD_BODY))
                    .andExpect(status().isUnauthorized());
        }

        assertThat(failedAttempts())
                .as("The failure counter must reach the configured threshold")
                .isEqualTo(MAX_ATTEMPTS);
        assertThat(lockedUntilIsSet())
                .as("The account must be locked once the threshold is reached")
                .isTrue();

        // Locked account: further attempts fail fast with 429 + Retry-After
        mockMvc.perform(post(LOGIN_PATH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(WRONG_PASSWORD_BODY))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"));
    }

    @Test
    @Order(3)
    void lockedAccount_withValidCredentials_stillReturns429() throws Exception {
        mockMvc.perform(post(LOGIN_PATH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(CORRECT_CREDENTIALS_BODY))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"));
    }

    private Integer failedAttempts() {
        return jdbcTemplate.queryForObject(
                "SELECT failed_login_attempts FROM users WHERE username = ?", Integer.class, "admin");
    }

    private boolean lockedUntilIsSet() {
        Integer locked = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE username = ? AND locked_until IS NOT NULL",
                Integer.class, "admin");
        return locked != null && locked > 0;
    }
}
