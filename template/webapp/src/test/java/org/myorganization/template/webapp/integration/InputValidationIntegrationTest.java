package org.myorganization.template.webapp.integration;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.myorganization.template.webapp.security.JwtTokenProvider;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration test for request payload validation (SEC-05).
 *
 * <p>Verifies that invalid payloads on the administration endpoints are rejected
 * with 400 Bad Request (via Bean Validation) instead of surfacing as 500 errors.</p>
 *
 * <p>Uses a real PostgreSQL database via Testcontainers.</p>
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers
@ActiveProfiles("test")
class InputValidationIntegrationTest {

    private static final String USERS_PATH = "/api/v1/administration/security/users";
    private static final String PROFILES_PATH = "/api/v1/administration/security/profiles";
    private static final String PARAMETERS_PATH = "/api/v1/administration/parameters";

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
        // This test manages its own container and supplies a plain jdbc:postgresql:// URL,
        // so override the Testcontainers JDBC-URL driver configured in application-test.yml
        // with the standard PostgreSQL driver to match the URL.
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
    private JdbcTemplate jdbcTemplate;

    private String token(String... authorities) {
        return jwtTokenProvider.generateAccessToken("admin", "TestProfile", List.of(authorities));
    }

    // =====================================================================
    // Users
    // =====================================================================

    @Test
    void postUser_withoutPassword_returns400NotServerError() throws Exception {
        mockMvc.perform(post(USERS_PATH)
                        .header("Authorization", "Bearer " + token("USER_WRITE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"newuser\",\"email\":\"new@example.com\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void postUser_withoutUsername_returns400() throws Exception {
        mockMvc.perform(post(USERS_PATH)
                        .header("Authorization", "Bearer " + token("USER_WRITE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\"secret\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void postUser_withInvalidEmail_returns400() throws Exception {
        mockMvc.perform(post(USERS_PATH)
                        .header("Authorization", "Bearer " + token("USER_WRITE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"newuser\",\"password\":\"secret\",\"email\":\"not-an-email\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void putUser_withInvalidEmail_returns400() throws Exception {
        Long adminId = jdbcTemplate.queryForObject(
                "SELECT id FROM users WHERE username = 'admin'", Long.class);

        mockMvc.perform(put(USERS_PATH + "/" + adminId)
                        .header("Authorization", "Bearer " + token("USER_WRITE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"firstName\":\"Admin\",\"email\":\"not-an-email\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void putMyProfile_withInvalidEmail_returns400() throws Exception {
        mockMvc.perform(put(USERS_PATH + "/me")
                        .header("Authorization", "Bearer " + token("USER_READ"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"firstName\":\"Admin\",\"lastName\":\"User\",\"email\":\"not-an-email\"}"))
                .andExpect(status().isBadRequest());
    }

    // =====================================================================
    // Profiles
    // =====================================================================

    @Test
    void postProfile_withoutName_returns400() throws Exception {
        mockMvc.perform(post(PROFILES_PATH)
                        .header("Authorization", "Bearer " + token("PROFILE_WRITE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"description\":\"No name provided\"}"))
                .andExpect(status().isBadRequest());
    }

    // =====================================================================
    // Parameters
    // =====================================================================

    @Test
    void postParameter_withoutCode_returns400() throws Exception {
        mockMvc.perform(post(PARAMETERS_PATH)
                        .header("Authorization", "Bearer " + token("SYSTEM_PARAMETER_WRITE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"value\":\"some-value\",\"type\":\"STRING\"}"))
                .andExpect(status().isBadRequest());
    }
}
