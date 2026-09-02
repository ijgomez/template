package org.myorganization.template.webapp.integration;

import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import jakarta.servlet.http.Cookie;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration test for the full authentication flow.
 *
 * <p>Tests: login, token issuance via cookie, protected access, refresh via cookie, logout
 * using a real PostgreSQL database via Testcontainers.</p>
 *
 * <p>Also verifies that Liquibase migrations apply successfully on startup.</p>
 *
 * <p><b>Validates: Requirements 1.1, 1.2, 1.3, 2.2, 3.1, 3.2</b></p>
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AuthenticationFlowIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:18-alpine")
            .withDatabaseName("template_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        // This test manages its own container and supplies a plain jdbc:postgresql:// URL,
        // so override the Testcontainers JDBC-URL driver configured in application-test.yml
        // with the standard PostgreSQL driver to match the URL.
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
        registry.add("spring.liquibase.enabled", () -> "true");
        registry.add("spring.liquibase.change-log", () -> "classpath:db/changelog/db.changelog-test.xml");
        registry.add("spring.liquibase.contexts", () -> "test");
        registry.add("auth.cookie.name", () -> "refresh-token");
        registry.add("auth.cookie.path", () -> "/template/api/v1/auth");
        registry.add("auth.cookie.max-age-seconds", () -> "604800");
        registry.add("auth.cookie.secure", () -> "false");
        registry.add("auth.cookie.same-site", () -> "Lax");
    }

    @Autowired
    private MockMvc mockMvc;

    private static String accessToken;
    private static Cookie refreshTokenCookie;

    @Test
    @Order(1)
    void contextLoadsAndLiquibaseMigrationsApply() {
        // If context loads without error, Liquibase migrations applied successfully
    }

    @Test
    @Order(2)
    void loginWithValidCredentials_returnsTokenPair() throws Exception {
        String loginBody = """
                {"username": "admin", "password": "admin123"}
                """;

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andReturn();

        String response = result.getResponse().getContentAsString();
        accessToken = extractJsonField(response, "accessToken");

        // Refresh token should be in a Set-Cookie header, not in the body
        refreshTokenCookie = result.getResponse().getCookie("refresh-token");
        assert refreshTokenCookie != null : "refresh-token cookie should be set";
        assert refreshTokenCookie.isHttpOnly() : "cookie should be HttpOnly";
    }

    @Test
    @Order(3)
    void accessProtectedEndpointWithToken_returns200() throws Exception {
        mockMvc.perform(get("/api/v1/administration/security/users")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk());
    }

    @Test
    @Order(4)
    void accessProtectedEndpointWithoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/administration/security/users"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(5)
    void refreshToken_returnsNewTokenPair() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(refreshTokenCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andReturn();

        String response = result.getResponse().getContentAsString();
        accessToken = extractJsonField(response, "accessToken");

        // A rotated cookie should be set
        refreshTokenCookie = result.getResponse().getCookie("refresh-token");
        assert refreshTokenCookie != null : "rotated refresh-token cookie should be set";
    }

    @Test
    @Order(6)
    void refreshWithNoCookie_returns401() throws Exception {
        mockMvc.perform(post("/api/v1/auth/refresh"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(7)
    void logout_invalidatesRefreshToken() throws Exception {
        mockMvc.perform(post("/api/v1/auth/logout")
                        .cookie(refreshTokenCookie))
                .andExpect(status().isOk());

        // Attempt to refresh with the invalidated token should fail
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(refreshTokenCookie))
                .andExpect(status().isUnauthorized());
    }

    private static String extractJsonField(String json, String field) {
        String key = "\"" + field + "\":\"";
        int start = json.indexOf(key) + key.length();
        int end = json.indexOf("\"", start);
        return json.substring(start, end);
    }
}
