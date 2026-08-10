package org.myorganization.template.webapp.security;

import java.io.IOException;
import java.time.Instant;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Spring Security configuration.
 * <p>
 * Configures stateless session management, CORS for Angular frontend,
 * BCrypt password encoder, JWT authentication filter, and endpoint authorization rules
 * including action-based access control and 405 restrictions.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${cors.allowed-origins:http://localhost:4200}")
    private List<String> allowedOrigins;

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(this::handleAuthenticationError)
                        .accessDeniedHandler(this::handleAccessDenied)
                )
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints
                        .requestMatchers("/api/v1/auth/**").permitAll()

                        // 405 Method Not Allowed: Actions create/delete
                        .requestMatchers(HttpMethod.POST, "/api/v1/administration/security/actions").denyAll()
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/administration/security/actions/**").denyAll()

                        // 405 Method Not Allowed: Cluster nodes create/delete
                        .requestMatchers(HttpMethod.POST, "/api/v1/administration/cluster/nodes").denyAll()
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/administration/cluster/nodes/**").denyAll()

                        // 405 Method Not Allowed: Cluster blocks CUD
                        .requestMatchers(HttpMethod.POST, "/api/v1/administration/cluster/blocks/**").denyAll()
                        .requestMatchers(HttpMethod.PUT, "/api/v1/administration/cluster/blocks/**").denyAll()
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/administration/cluster/blocks/**").denyAll()
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/administration/cluster/blocks/**").denyAll()

                        // 405 Method Not Allowed: Audit CUD
                        .requestMatchers(HttpMethod.POST, "/api/v1/administration/audit/**").denyAll()
                        .requestMatchers(HttpMethod.PUT, "/api/v1/administration/audit/**").denyAll()
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/administration/audit/**").denyAll()
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/administration/audit/**").denyAll()

                        // 405 Method Not Allowed: Interfaces CUD
                        .requestMatchers(HttpMethod.POST, "/api/v1/interfaces/**").denyAll()
                        .requestMatchers(HttpMethod.PUT, "/api/v1/interfaces/**").denyAll()
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/interfaces/**").denyAll()
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/interfaces/**").denyAll()

                        // Users: /me endpoints accessible to any authenticated user
                        .requestMatchers(HttpMethod.GET, "/api/v1/administration/security/users/me").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/v1/administration/security/users/me").authenticated()

                        // Users: read vs write
                        .requestMatchers(HttpMethod.GET, "/api/v1/administration/security/users/**").hasAnyAuthority("USER_READ", "USER_WRITE")
                        .requestMatchers(HttpMethod.POST, "/api/v1/administration/security/users/**").hasAuthority("USER_WRITE")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/administration/security/users/**").hasAuthority("USER_WRITE")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/administration/security/users/**").hasAuthority("USER_WRITE")

                        // Profiles: read vs write
                        .requestMatchers(HttpMethod.GET, "/api/v1/administration/security/profiles/**").hasAnyAuthority("PROFILE_READ", "PROFILE_WRITE")
                        .requestMatchers(HttpMethod.POST, "/api/v1/administration/security/profiles/**").hasAuthority("PROFILE_WRITE")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/administration/security/profiles/**").hasAuthority("PROFILE_WRITE")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/administration/security/profiles/**").hasAuthority("PROFILE_WRITE")

                        // Actions: read + update only (create/delete already denied above)
                        .requestMatchers(HttpMethod.GET, "/api/v1/administration/security/actions/**").hasAuthority("ACTION_READ")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/administration/security/actions/**").hasAuthority("ACTION_READ")

                        // Parameters: read vs write
                        .requestMatchers(HttpMethod.GET, "/api/v1/administration/parameters/**").hasAnyAuthority("SYSTEM_PARAMETER_READ", "SYSTEM_PARAMETER_WRITE")
                        .requestMatchers(HttpMethod.POST, "/api/v1/administration/parameters/**").hasAuthority("SYSTEM_PARAMETER_WRITE")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/administration/parameters/**").hasAuthority("SYSTEM_PARAMETER_WRITE")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/administration/parameters/**").hasAuthority("SYSTEM_PARAMETER_WRITE")

                        // Audit: read only (CUD already denied above)
                        .requestMatchers(HttpMethod.GET, "/api/v1/administration/audit/**").hasAuthority("SYSTEM_LOG_READ")

                        // Interfaces: read only (CUD already denied above)
                        .requestMatchers(HttpMethod.GET, "/api/v1/interfaces/**").hasAuthority("INTERFACES_READ")

                        // Cluster nodes: read + write (PATCH for master toggle)
                        .requestMatchers(HttpMethod.GET, "/api/v1/administration/cluster/nodes/**").hasAnyAuthority("CLUSTER_NODE_READ", "CLUSTER_NODE_WRITE")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/administration/cluster/nodes/**").hasAuthority("CLUSTER_NODE_WRITE")

                        // Cluster blocks: read only (CUD already denied above)
                        .requestMatchers(HttpMethod.GET, "/api/v1/administration/cluster/blocks/**").hasAuthority("CLUSTER_LOCK_READ")

                        // Reports
                        .requestMatchers("/api/v1/reports/**").hasAuthority("REPORT_EXECUTE")

                        // Any other authenticated request
                        .anyRequest().authenticated()
                );

        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "X-Requested-With"));
        configuration.setExposedHeaders(List.of("Authorization", "Set-Cookie"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    private void handleAuthenticationError(HttpServletRequest request,
                                           HttpServletResponse response,
                                           org.springframework.security.core.AuthenticationException authException) throws IOException {
        writeErrorResponse(response, HttpStatus.UNAUTHORIZED, "Unauthorized", request.getRequestURI());
    }

    private void handleAccessDenied(HttpServletRequest request,
                                    HttpServletResponse response,
                                    org.springframework.security.access.AccessDeniedException accessDeniedException) throws IOException {
        // Determine if this is a 405 (denyAll) or a 403 (insufficient authority)
        // denyAll rules result in AccessDeniedException, but we return 405 for those specific endpoints
        if (isMethodNotAllowed(request)) {
            writeErrorResponse(response, HttpStatus.METHOD_NOT_ALLOWED, "Method Not Allowed", request.getRequestURI());
        } else {
            writeErrorResponse(response, HttpStatus.FORBIDDEN, "Forbidden", request.getRequestURI());
        }
    }

    private boolean isMethodNotAllowed(HttpServletRequest request) {
        String method = request.getMethod();
        String path = request.getRequestURI();

        // Actions: POST create or DELETE
        if (path.startsWith("/api/v1/administration/security/actions")) {
            if ("POST".equals(method) && path.equals("/api/v1/administration/security/actions")) {
                return true;
            }
            if ("DELETE".equals(method)) {
                return true;
            }
        }

        // Cluster nodes: POST create or DELETE
        if (path.startsWith("/api/v1/administration/cluster/nodes")) {
            if ("POST".equals(method) && path.equals("/api/v1/administration/cluster/nodes")) {
                return true;
            }
            if ("DELETE".equals(method)) {
                return true;
            }
        }

        // Cluster blocks: any CUD
        if (path.startsWith("/api/v1/administration/cluster/blocks")) {
            if ("POST".equals(method) || "PUT".equals(method) || "PATCH".equals(method) || "DELETE".equals(method)) {
                return true;
            }
        }

        // Audit: any CUD
        if (path.startsWith("/api/v1/administration/audit")) {
            if ("POST".equals(method) || "PUT".equals(method) || "PATCH".equals(method) || "DELETE".equals(method)) {
                return true;
            }
        }

        // Interfaces: any CUD
        if (path.startsWith("/api/v1/interfaces")) {
            if ("POST".equals(method) || "PUT".equals(method) || "PATCH".equals(method) || "DELETE".equals(method)) {
                return true;
            }
        }

        return false;
    }

    private void writeErrorResponse(HttpServletResponse response, HttpStatus status, String error, String path) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        String json = String.format(
                "{\"timestamp\":\"%s\",\"status\":%d,\"error\":\"%s\",\"message\":\"%s\",\"path\":\"%s\"}",
                Instant.now().toString(),
                status.value(),
                error,
                status.getReasonPhrase(),
                path
        );

        response.getOutputStream().write(json.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }

}
