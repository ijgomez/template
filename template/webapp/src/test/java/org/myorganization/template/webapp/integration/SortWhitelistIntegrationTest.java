package org.myorganization.template.webapp.integration;

import java.util.List;

import org.junit.jupiter.api.Test;
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

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration test for the sort allowlist (SEC-10).
 *
 * <p>
 * Verifies that ordering by a property outside the per-entity allowlist is rejected
 * with a controlled 400 payload (no stack trace, no internal details), and that
 * allowlisted properties continue to work.
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
class SortWhitelistIntegrationTest {

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

    private String token(String... authorities) {
        return jwtTokenProvider.generateAccessToken("secuser", "TestProfile", List.of(authorities));
    }

    @Test
    void getActions_withAllowlistedSort_returns200() throws Exception {
        mockMvc.perform(get("/api/v1/administration/security/actions")
                        .param("sort", "code,desc")
                        .header("Authorization", "Bearer " + token("ACTION_READ")))
                .andExpect(status().isOk());
    }

    @Test
    void getActions_withUnknownSortProperty_returns400WithoutTrace() throws Exception {
        mockMvc.perform(get("/api/v1/administration/security/actions")
                        .param("sort", "campoInexistente,asc")
                        .header("Authorization", "Bearer " + token("ACTION_READ")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Invalid sort property: campoInexistente"))
                .andExpect(jsonPath("$.trace").doesNotExist())
                .andExpect(content().string(not(containsString("PropertyReferenceException"))))
                .andExpect(content().string(not(containsString("org.springframework"))));
    }

    @Test
    void getInterfaces_withUnknownSortProperty_returns400WithoutTrace() throws Exception {
        mockMvc.perform(get("/api/v1/interfaces/configuration/search")
                        .param("sort", "campoInexistente,asc")
                        .header("Authorization", "Bearer " + token("INTERFACES_READ")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Invalid sort property: campoInexistente"))
                .andExpect(jsonPath("$.trace").doesNotExist())
                .andExpect(content().string(not(containsString("org.springframework"))));
    }
}
