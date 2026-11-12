package org.myorganization.template.webapp.integration;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.myorganization.template.core.repository.ActionRepository;
import org.myorganization.template.core.repository.ProfileRepository;
import org.myorganization.template.domain.entity.Profile;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration test for the segregation-of-duties guard (SEC-07) against the real
 * Spring Security configuration.
 *
 * <p>
 * Granting permissions is separated from administering the resource: editing the
 * actions of a profile additionally requires {@code PROFILE_GRANT} and assigning a
 * profile to a user additionally requires {@code USER_GRANT}. An administrator that
 * only holds the write permission of the resource must be rejected with 403, while
 * the same request succeeds when the grant authority is present.
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
class GrantSecurityIntegrationTest {

    /** Seeded profile with full access (all actions). */
    private static final long ADMIN_PROFILE_ID = 1000L;

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
    private ActionRepository actionRepository;

    @Autowired
    private ProfileRepository profileRepository;

    private String token(String... authorities) {
        return jwtTokenProvider.generateAccessToken("secuser", "TestProfile", List.of(authorities));
    }

    // --- PROFILE_GRANT ---

    @Test
    void postProfile_withActionsAndOnlyProfileWrite_returns403() throws Exception {
        mockMvc.perform(post("/api/v1/administration/security/profiles")
                .header("Authorization", "Bearer " + token("PROFILE_WRITE"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"GrantDenied\",\"description\":\"desc\",\"actionIds\":[" + anyActionId() + "]}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void postProfile_withActionsAndProfileGrant_returns201() throws Exception {
        mockMvc.perform(post("/api/v1/administration/security/profiles")
                .header("Authorization", "Bearer " + token("PROFILE_WRITE", "PROFILE_GRANT"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"GrantAllowed\",\"description\":\"desc\",\"actionIds\":[" + anyActionId() + "]}"))
                .andExpect(status().isCreated());
    }

    @Test
    void putProfile_changingActionsWithOnlyProfileWrite_returns403() throws Exception {
        Profile profile = profileRepository.findById(ADMIN_PROFILE_ID).orElseThrow();

        mockMvc.perform(put("/api/v1/administration/security/profiles/" + ADMIN_PROFILE_ID)
                .header("Authorization", "Bearer " + token("PROFILE_WRITE"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"" + profile.getName() + "\",\"description\":\"desc\",\"actionIds\":["
                        + anyActionId() + "]}"))
                .andExpect(status().isForbidden());
    }

    // --- USER_GRANT ---

    @Test
    void postUser_assigningProfileWithOnlyUserWrite_returns403() throws Exception {
        mockMvc.perform(post("/api/v1/administration/security/users")
                .header("Authorization", "Bearer " + token("USER_WRITE"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"grantdenied\",\"password\":\"secret\",\"firstName\":\"G\",\"lastName\":\"D\","
                        + "\"email\":\"grantdenied@test.com\",\"profileId\":" + ADMIN_PROFILE_ID + ",\"reportIds\":[]}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void postUser_assigningProfileWithUserGrant_returns201() throws Exception {
        mockMvc.perform(post("/api/v1/administration/security/users")
                .header("Authorization", "Bearer " + token("USER_WRITE", "USER_GRANT"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"grantallowed\",\"password\":\"secret\",\"firstName\":\"G\",\"lastName\":\"A\","
                        + "\"email\":\"grantallowed@test.com\",\"profileId\":" + ADMIN_PROFILE_ID + ",\"reportIds\":[]}"))
                .andExpect(status().isCreated());
    }

    @Test
    void putUser_changingProfileWithOnlyUserWrite_returns403() throws Exception {
        mockMvc.perform(put("/api/v1/administration/security/users/" + ADMIN_USER_ID)
                .header("Authorization", "Bearer " + token("USER_WRITE"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"admin\",\"firstName\":\"Admin\",\"lastName\":\"User\","
                        + "\"email\":\"admin@test.com\",\"profileId\":null,\"reportIds\":[]}"))
                .andExpect(status().isForbidden());
    }

    /**
     * Returns the identifier of any seeded action, used to build a request that
     * effectively grants a permission.
     */
    private long anyActionId() {
        return actionRepository.findAll().getFirst().getId();
    }
}
