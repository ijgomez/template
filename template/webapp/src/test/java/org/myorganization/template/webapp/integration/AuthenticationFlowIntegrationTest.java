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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration test for the full authentication flow.
 *
 * <p>Tests: login, token issuance, protected access, refresh, logout
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
        registry.add("spring.liquibase.enabled", () -> "true");
        registry.add("spring.liquibase.change-log", () -> "classpath:db/changelog/db.changelog-test.xml");
        registry.add("spring.liquibase.contexts", () -> "test");
    }

    @Autowired
    private MockMvc mockMvc;

    private static String accessToken;
    private static String refreshToken;

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
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andReturn();

        String response = result.getResponse().getContentAsString();
        accessToken = extractJsonField(response, "accessToken");
        refreshToken = extractJsonField(response, "refreshToken");
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
        String refreshBody = String.format("""
                {"refreshToken": "%s"}
                """, refreshToken);

        MvcResult result = mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(refreshBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andReturn();

        String response = result.getResponse().getContentAsString();
        accessToken = extractJsonField(response, "accessToken");
        refreshToken = extractJsonField(response, "refreshToken");
    }

    @Test
    @Order(6)
    void logout_invalidatesRefreshToken() throws Exception {
        String logoutBody = String.format("""
                {"refreshToken": "%s"}
                """, refreshToken);

        mockMvc.perform(post("/api/v1/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(logoutBody)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk());

        // Attempt to refresh with the invalidated token should fail
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(logoutBody))
                .andExpect(status().isUnauthorized());
    }

    private static String extractJsonField(String json, String field) {
        String key = "\"" + field + "\":\"";
        int start = json.indexOf(key) + key.length();
        int end = json.indexOf("\"", start);
        return json.substring(start, end);
    }
}
