package org.myorganization.template.webapp.security;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import jakarta.servlet.Filter;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
/**
 * Verifies the actuator rules of the real {@link SecurityConfig} filter chain:
 * only {@code /actuator/health} is public; every other actuator path is denied.
 * No actuator is registered in this context, so an allowed request ends in 404
 * (no handler) whereas a denied one is rejected by security with 401/403.
 */
@ExtendWith(SpringExtension.class)
@WebAppConfiguration
@ContextConfiguration(classes = ActuatorSecurityTest.TestConfig.class)
class ActuatorSecurityTest {

    @Configuration
    @EnableWebSecurity
    @Import(SecurityConfig.class)
    static class TestConfig {
        @Bean
        JwtTokenProvider jwtTokenProvider() {
            return new JwtTokenProvider("test-secret-key-for-actuator-security-minimum-32-chars", 900000L);
        }

        @Bean
        UserDetailsService userDetailsService() {
            return new InMemoryUserDetailsManager();
        }

        @Bean
        JwtAuthenticationFilter jwtAuthenticationFilter(JwtTokenProvider provider) {
            return new JwtAuthenticationFilter(provider);
        }
    }

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private Filter springSecurityFilterChain;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity(springSecurityFilterChain)).build();
    }

    @Test
    void should_notRejectHealth_when_requestedWithoutToken() throws Exception {
        // when
        int status = mockMvc.perform(MockMvcRequestBuilders.get("/actuator/health"))
                .andReturn().getResponse().getStatus();

        // then
        assertThat(status).isNotIn(401, 403);
    }

    @Test
    void should_notRejectHealthProbes_when_requestedWithoutToken() throws Exception {
        // when
        int status = mockMvc.perform(MockMvcRequestBuilders.get("/actuator/health/liveness"))
                .andReturn().getResponse().getStatus();

        // then
        assertThat(status).isNotIn(401, 403);
    }

    @Test
    void should_rejectOtherActuatorEndpoints_when_requestedWithoutToken() throws Exception {
        for (String path : new String[] {"/actuator/env", "/actuator/info", "/actuator/metrics", "/actuator"}) {
            // when
            int status = mockMvc.perform(MockMvcRequestBuilders.get(path))
                    .andReturn().getResponse().getStatus();

            // then
            assertThat(status).as(path).isIn(401, 403);
        }
    }
}
