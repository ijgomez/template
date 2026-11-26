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
 * Verifies that the real {@link SecurityConfig} filter chain sends the Content-Security-Policy
 * header on every response: SPA routes, static files, public and protected API paths.
 */
@ExtendWith(SpringExtension.class)
@WebAppConfiguration
@ContextConfiguration(classes = ContentSecurityPolicyHeaderTest.TestConfig.class)
class ContentSecurityPolicyHeaderTest {

    @Configuration
    @EnableWebSecurity
    @Import(SecurityConfig.class)
    static class TestConfig {
        @Bean
        JwtTokenProvider jwtTokenProvider() {
            return new JwtTokenProvider("test-secret-key-for-csp-header-security-minimum-32-chars", 900000L);
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
    void should_sendDefaultPolicy_when_anyPathIsRequested() throws Exception {
        for (String path : new String[] {"/", "/dashboard", "/main.js", "/api/v1/auth/login", "/api/v1/reports",
                "/actuator/env"}) {
            // when
            String csp = mockMvc.perform(MockMvcRequestBuilders.get(path))
                    .andReturn().getResponse().getHeader("Content-Security-Policy");
            // then
            assertThat(csp).as(path).isEqualTo(SecurityConfig.DEFAULT_CONTENT_SECURITY_POLICY);
        }
    }

    @Test
    void should_sendHardeningHeaders_when_anyPathIsRequested() throws Exception {
        for (String path : new String[] {"/", "/api/v1/auth/login", "/api/v1/reports"}) {
            var response = mockMvc.perform(MockMvcRequestBuilders.get(path)).andReturn().getResponse();

            assertThat(response.getHeader("X-Content-Type-Options")).as(path).isEqualTo("nosniff");
            assertThat(response.getHeader("X-Frame-Options")).as(path).isEqualTo("DENY");
            assertThat(response.getHeader("Referrer-Policy")).as(path).isEqualTo("strict-origin-when-cross-origin");
            assertThat(response.getHeader("Permissions-Policy")).as(path).isEqualTo(SecurityConfig.PERMISSIONS_POLICY);
        }
    }

    @Test
    void should_restrictScriptsAndFraming_when_usingDefaultPolicy() {
        String csp = SecurityConfig.DEFAULT_CONTENT_SECURITY_POLICY;
        assertThat(csp).contains("script-src 'self';")
                .contains("object-src 'none'")
                .contains("frame-ancestors 'none'")
                .contains("base-uri 'self'")
                .doesNotContain("unsafe-eval");
        assertThat(csp.substring(csp.indexOf("script-src"), csp.indexOf(';', csp.indexOf("script-src"))))
                .doesNotContain("unsafe-inline");
    }
}
