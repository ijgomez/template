package org.myorganization.template.webapp.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Regression test for SEC-01.
 *
 * <p>Simulates a distribution deployment that applies the master changelog without
 * an explicit Liquibase context (the situation that previously caused Liquibase to
 * execute the <code>context="local"</code> seed changesets). Verifies that the local
 * development seeds (admin profile and the known <code>admin</code> user) are
 * <b>never</b> applied outside the <code>local</code> profile.</p>
 *
 * <p><b>Validates: SEC-01 (security audit)</b></p>
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@ActiveProfiles("test")
class DistributionSeedingIntegrationTest {

    @Container
    @SuppressWarnings("resource") // closed by the Testcontainers extension via @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:18-alpine")
            .withDatabaseName("template_dist_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        // Plain JDBC URL -> use the standard PostgreSQL driver instead of the
        // Testcontainers JDBC-URL driver configured in application-test.yml.
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
        registry.add("spring.liquibase.enabled", () -> "true");
        // Only the master changelog, as used by the 'dist' profile. No context is
        // set on purpose: this reproduces a deployment without an explicit context.
        registry.add("spring.liquibase.change-log", () -> "classpath:db/changelog/db.changelog-master.xml");
    }

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void masterChangelogWithoutContextDoesNotSeedLocalAdminUser() {
        Integer adminUsers = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE username = 'admin'", Integer.class);
        assertThat(adminUsers)
                .as("El usuario 'admin' de desarrollo no debe crearse fuera del perfil local")
                .isZero();

        Integer adminProfiles = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM profile WHERE name = 'Administrador'", Integer.class);
        assertThat(adminProfiles)
                .as("El perfil 'Administrador' de desarrollo no debe crearse fuera del perfil local")
                .isZero();
    }
}
