package org.myorganization.template.webapp.integration;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.myorganization.template.core.repository.ActionRepository;
import org.myorganization.template.webapp.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration test for the action catalog endpoints against the real
 * {@code SecurityConfig}.
 *
 * <p>
 * SEC-02: verifies that editing an action ({@code PUT}) requires the
 * dedicated {@code ACTION_WRITE} authority. A profile with only
 * {@code ACTION_READ} (read-only) must not be able to modify the permission
 * catalog, while reads ({@code GET}) remain allowed for both.
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
class ActionSecurityIntegrationTest {

    /** Seeded action id (ACTION_READ) used as the target of the updates. */
    private static final long ACTION_ID = 8L;

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
        // This test manages its own container and supplies a plain jdbc:postgresql://
        // URL,
        // so override the Testcontainers JDBC-URL driver configured in
        // application-test.yml
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
    private ActionRepository actionRepository;

    private String token(String... authorities) {
        return jwtTokenProvider.generateAccessToken("secuser", "TestProfile", List.of(authorities));
    }

    @Test
    void getActions_withActionRead_returns200() throws Exception {
        mockMvc.perform(get("/api/v1/administration/security/actions")
                .header("Authorization", "Bearer " + token("ACTION_READ")))
                .andExpect(status().isOk());
    }

    @Test
    void getActionById_withActionWrite_returns200() throws Exception {
        mockMvc.perform(get("/api/v1/administration/security/actions/" + ACTION_ID)
                .header("Authorization", "Bearer " + token("ACTION_WRITE")))
                .andExpect(status().isOk());
    }

    @Test
    void putAction_withOnlyActionRead_returns403() throws Exception {
        String nameBefore = actionRepository.findById(ACTION_ID).orElseThrow().getName();

        mockMvc.perform(put("/api/v1/administration/security/actions/" + ACTION_ID)
                .header("Authorization", "Bearer " + token("ACTION_READ"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"code\":\"ACTION_READ\",\"type\":\"READ\",\"name\":\"Read-only attempt\"}"))
                .andExpect(status().isForbidden());

        // The catalog must remain unchanged.
        assertThat(actionRepository.findById(ACTION_ID).orElseThrow().getName())
                .isEqualTo(nameBefore);
    }

    @Test
    void putAction_withActionWrite_returns200AndPersistsChange() throws Exception {
        mockMvc.perform(put("/api/v1/administration/security/actions/" + ACTION_ID)
                .header("Authorization", "Bearer " + token("ACTION_WRITE"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"code\":\"ACTION_READ\",\"type\":\"READ\",\"name\":\"Edited by ACTION_WRITE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Edited by ACTION_WRITE"));

        assertThat(actionRepository.findById(ACTION_ID).orElseThrow().getName())
                .isEqualTo("Edited by ACTION_WRITE");
    }
}
