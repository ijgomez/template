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
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
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

    private static final String ALL_SUFFIX = "/**";

    private static final String API_BASE_PATH = "/api/v1";
    private static final String ADMIN_BASE_PATH = API_BASE_PATH + "/administration";

    private static final String AUTH_PATH = API_BASE_PATH + "/auth" + ALL_SUFFIX;
    private static final String REPORTS_ALL_PATH = API_BASE_PATH + "/reports" + ALL_SUFFIX;
    private static final String API_ALL_PATH = API_BASE_PATH + ALL_SUFFIX;
    private static final String INTERFACES_PATH = API_BASE_PATH + "/interfaces";
    private static final String INTERFACES_ALL_PATH = INTERFACES_PATH + ALL_SUFFIX;

    private static final String ACTIONS_PATH = ADMIN_BASE_PATH + "/security/actions";
    private static final String ACTIONS_ALL_PATH = ACTIONS_PATH + ALL_SUFFIX;
    private static final String PROFILES_PATH = ADMIN_BASE_PATH + "/security/profiles";
    private static final String PROFILES_ALL_PATH = PROFILES_PATH + ALL_SUFFIX;
    private static final String PROFILES_REFERENCES_PATH = PROFILES_PATH + "/references";
    private static final String USERS_PATH = ADMIN_BASE_PATH + "/security/users";
    private static final String USERS_ALL_PATH = USERS_PATH + ALL_SUFFIX;
    private static final String USERS_ME_PATH = USERS_PATH + "/me";

    private static final String PARAMETERS_ALL_PATH = ADMIN_BASE_PATH + "/parameters" + ALL_SUFFIX;
    private static final String AUDIT_PATH = ADMIN_BASE_PATH + "/audit";
    private static final String AUDIT_ALL_PATH = AUDIT_PATH + ALL_SUFFIX;

    private static final String CLUSTER_NODES_PATH = ADMIN_BASE_PATH + "/cluster/nodes";
    private static final String CLUSTER_NODES_ALL_PATH = CLUSTER_NODES_PATH + ALL_SUFFIX;
    private static final String CLUSTER_NODE_JOBS_PATH = CLUSTER_NODES_PATH + "/*/jobs";
    private static final String CLUSTER_NODE_JOBS_ALL_PATH = CLUSTER_NODE_JOBS_PATH + ALL_SUFFIX;
    private static final String CLUSTER_BLOCKS_PATH = ADMIN_BASE_PATH + "/cluster/blocks";
    private static final String CLUSTER_BLOCKS_ALL_PATH = CLUSTER_BLOCKS_PATH + ALL_SUFFIX;
    private static final String CLUSTER_TASKS_PATH = ADMIN_BASE_PATH + "/cluster/tasks";

    private static final String AUTHORITY_CLUSTER_NODE_READ = "CLUSTER_NODE_READ";
    private static final String AUTHORITY_CLUSTER_NODE_WRITE = "CLUSTER_NODE_WRITE";
    private static final String AUTHORITY_CLUSTER_LOCK_READ = "CLUSTER_LOCK_READ";
    private static final String AUTHORITY_USER_READ = "USER_READ";
    private static final String AUTHORITY_USER_WRITE = "USER_WRITE";
    private static final String AUTHORITY_PROFILE_READ = "PROFILE_READ";
    private static final String AUTHORITY_PROFILE_WRITE = "PROFILE_WRITE";
    private static final String AUTHORITY_ACTION_READ = "ACTION_READ";
    private static final String AUTHORITY_ACTION_WRITE = "ACTION_WRITE";
    private static final String AUTHORITY_SYSTEM_PARAMETER_READ = "SYSTEM_PARAMETER_READ";
    private static final String AUTHORITY_SYSTEM_PARAMETER_WRITE = "SYSTEM_PARAMETER_WRITE";
    private static final String AUTHORITY_SYSTEM_LOG_READ = "SYSTEM_LOG_READ";
    private static final String AUTHORITY_INTERFACES_READ = "INTERFACES_READ";
    private static final String AUTHORITY_REPORT_EXECUTE = "REPORT_EXECUTE";

    @Value("${cors.allowed-origins:http://localhost:4200}")
    private List<String> allowedOrigins;

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) {
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
                        .requestMatchers(AUTH_PATH).permitAll()

                        // 405 Method Not Allowed: Actions create/delete
                        .requestMatchers(HttpMethod.POST, ACTIONS_PATH).denyAll()
                        .requestMatchers(HttpMethod.DELETE, ACTIONS_ALL_PATH).denyAll()

                        // Cluster node jobs: write operations (must precede the node denyAll rules below)
                        .requestMatchers(HttpMethod.POST, CLUSTER_NODE_JOBS_PATH).hasAuthority(AUTHORITY_CLUSTER_NODE_WRITE)
                        .requestMatchers(HttpMethod.PUT, CLUSTER_NODE_JOBS_ALL_PATH).hasAuthority(AUTHORITY_CLUSTER_NODE_WRITE)
                        .requestMatchers(HttpMethod.DELETE, CLUSTER_NODE_JOBS_ALL_PATH).hasAuthority(AUTHORITY_CLUSTER_NODE_WRITE)

                        // 405 Method Not Allowed: Cluster nodes create/delete
                        .requestMatchers(HttpMethod.POST, CLUSTER_NODES_PATH).denyAll()
                        .requestMatchers(HttpMethod.DELETE, CLUSTER_NODES_ALL_PATH).denyAll()

                        // 405 Method Not Allowed: Cluster blocks CUD
                        .requestMatchers(HttpMethod.POST, CLUSTER_BLOCKS_ALL_PATH).denyAll()
                        .requestMatchers(HttpMethod.PUT, CLUSTER_BLOCKS_ALL_PATH).denyAll()
                        .requestMatchers(HttpMethod.PATCH, CLUSTER_BLOCKS_ALL_PATH).denyAll()
                        .requestMatchers(HttpMethod.DELETE, CLUSTER_BLOCKS_ALL_PATH).denyAll()

                        // 405 Method Not Allowed: Audit CUD
                        .requestMatchers(HttpMethod.POST, AUDIT_ALL_PATH).denyAll()
                        .requestMatchers(HttpMethod.PUT, AUDIT_ALL_PATH).denyAll()
                        .requestMatchers(HttpMethod.PATCH, AUDIT_ALL_PATH).denyAll()
                        .requestMatchers(HttpMethod.DELETE, AUDIT_ALL_PATH).denyAll()

                        // 405 Method Not Allowed: Interfaces CUD
                        .requestMatchers(HttpMethod.POST, INTERFACES_ALL_PATH).denyAll()
                        .requestMatchers(HttpMethod.PUT, INTERFACES_ALL_PATH).denyAll()
                        .requestMatchers(HttpMethod.PATCH, INTERFACES_ALL_PATH).denyAll()
                        .requestMatchers(HttpMethod.DELETE, INTERFACES_ALL_PATH).denyAll()

                        // Users: /me endpoints accessible to any authenticated user
                        .requestMatchers(HttpMethod.GET, USERS_ME_PATH).authenticated()
                        .requestMatchers(HttpMethod.PUT, USERS_ME_PATH).authenticated()

                        // Users: read vs write
                        .requestMatchers(HttpMethod.GET, USERS_ALL_PATH).hasAnyAuthority(AUTHORITY_USER_READ, AUTHORITY_USER_WRITE)
                        .requestMatchers(HttpMethod.POST, USERS_ALL_PATH).hasAuthority(AUTHORITY_USER_WRITE)
                        .requestMatchers(HttpMethod.PUT, USERS_ALL_PATH).hasAuthority(AUTHORITY_USER_WRITE)
                        .requestMatchers(HttpMethod.DELETE, USERS_ALL_PATH).hasAuthority(AUTHORITY_USER_WRITE)

                        // Profiles: references endpoint accessible to users who can view users
                        .requestMatchers(HttpMethod.GET, PROFILES_REFERENCES_PATH)
                        .hasAnyAuthority(AUTHORITY_USER_READ, AUTHORITY_USER_WRITE, AUTHORITY_PROFILE_READ, AUTHORITY_PROFILE_WRITE)

                        // Profiles: read vs write
                        .requestMatchers(HttpMethod.GET, PROFILES_ALL_PATH).hasAnyAuthority(AUTHORITY_PROFILE_READ, AUTHORITY_PROFILE_WRITE)
                        .requestMatchers(HttpMethod.POST, PROFILES_ALL_PATH).hasAuthority(AUTHORITY_PROFILE_WRITE)
                        .requestMatchers(HttpMethod.PUT, PROFILES_ALL_PATH).hasAuthority(AUTHORITY_PROFILE_WRITE)
                        .requestMatchers(HttpMethod.DELETE, PROFILES_ALL_PATH).hasAuthority(AUTHORITY_PROFILE_WRITE)

                        // Actions: read + write (create/delete already denied above)
                        .requestMatchers(HttpMethod.GET, ACTIONS_ALL_PATH).hasAnyAuthority(AUTHORITY_ACTION_READ, AUTHORITY_ACTION_WRITE)
                        .requestMatchers(HttpMethod.PUT, ACTIONS_ALL_PATH).hasAuthority(AUTHORITY_ACTION_WRITE)

                        // Parameters: read vs write
                        .requestMatchers(HttpMethod.GET, PARAMETERS_ALL_PATH)
                        .hasAnyAuthority(AUTHORITY_SYSTEM_PARAMETER_READ, AUTHORITY_SYSTEM_PARAMETER_WRITE)
                        .requestMatchers(HttpMethod.POST, PARAMETERS_ALL_PATH).hasAuthority(AUTHORITY_SYSTEM_PARAMETER_WRITE)
                        .requestMatchers(HttpMethod.PUT, PARAMETERS_ALL_PATH).hasAuthority(AUTHORITY_SYSTEM_PARAMETER_WRITE)
                        .requestMatchers(HttpMethod.DELETE, PARAMETERS_ALL_PATH).hasAuthority(AUTHORITY_SYSTEM_PARAMETER_WRITE)

                        // Audit: read only (CUD already denied above)
                        .requestMatchers(HttpMethod.GET, AUDIT_ALL_PATH).hasAuthority(AUTHORITY_SYSTEM_LOG_READ)

                        // Interfaces: read only (CUD already denied above)
                        .requestMatchers(HttpMethod.GET, INTERFACES_ALL_PATH).hasAuthority(AUTHORITY_INTERFACES_READ)

                        // Cluster nodes: read + write (PATCH for master toggle)
                        .requestMatchers(HttpMethod.GET, CLUSTER_NODES_ALL_PATH)
                        .hasAnyAuthority(AUTHORITY_CLUSTER_NODE_READ, AUTHORITY_CLUSTER_NODE_WRITE)
                        .requestMatchers(HttpMethod.PATCH, CLUSTER_NODES_ALL_PATH).hasAuthority(AUTHORITY_CLUSTER_NODE_WRITE)

                        // Cluster tasks: read (catalog consumed by the node form)
                        .requestMatchers(HttpMethod.GET, CLUSTER_TASKS_PATH)
                        .hasAnyAuthority(AUTHORITY_CLUSTER_NODE_READ, AUTHORITY_CLUSTER_NODE_WRITE)

                        // Cluster blocks: read only (CUD already denied above)
                        .requestMatchers(HttpMethod.GET, CLUSTER_BLOCKS_ALL_PATH).hasAuthority(AUTHORITY_CLUSTER_LOCK_READ)

                        // Reports
                        .requestMatchers(REPORTS_ALL_PATH).hasAuthority(AUTHORITY_REPORT_EXECUTE)

                        // Any other API request must be authenticated
                        .requestMatchers(API_ALL_PATH).authenticated()

                        // Everything else (Angular SPA routes and static resources) is public.
                        // SpaWebMvcConfig forwards non-file navigation routes to index.html,
                        // letting the Angular router resolve them client-side.
                        .anyRequest().permitAll()
                );

        try {
            return http.build();
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to build the security filter chain", ex);
        }
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
        source.registerCorsConfiguration(ALL_SUFFIX, configuration);
        return source;
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    /**
     * Authentication provider backed by the application's {@link UserDetailsService}.
     * <p>
     * Spring Security's account status checks run against the loaded user, so a
     * temporarily locked account (too many failed logins) is rejected with a
     * {@code LockedException} before the password is even verified.
     */
    @Bean
    AuthenticationProvider authenticationProvider(UserDetailsService userDetailsService,
                                                  PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }

    @Bean
    AuthenticationManager authenticationManager(AuthenticationProvider authenticationProvider) {
        return new ProviderManager(authenticationProvider);
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

        if (isActionsMethodNotAllowed(method, path) || isNodesMethodNotAllowed(method, path)) {
            return true;
        }

        return isWriteMethod(method) && (path.startsWith(AUDIT_PATH)
                || path.startsWith(INTERFACES_PATH)
                || path.startsWith(CLUSTER_BLOCKS_PATH));
    }

    /** Actions: POST create or DELETE. */
    private boolean isActionsMethodNotAllowed(String method, String path) {
        if (!path.startsWith(ACTIONS_PATH)) {
            return false;
        }
        return HttpMethod.DELETE.matches(method)
                || (HttpMethod.POST.matches(method) && path.equals(ACTIONS_PATH));
    }

    /** Cluster nodes: POST create or DELETE (but not job DELETE, which is allowed). */
    private boolean isNodesMethodNotAllowed(String method, String path) {
        if (!path.startsWith(CLUSTER_NODES_PATH)) {
            return false;
        }
        if (HttpMethod.POST.matches(method)) {
            return path.equals(CLUSTER_NODES_PATH);
        }
        return HttpMethod.DELETE.matches(method) && !path.contains("/jobs");
    }

    private boolean isWriteMethod(String method) {
        return HttpMethod.POST.matches(method)
                || HttpMethod.PUT.matches(method)
                || HttpMethod.PATCH.matches(method)
                || HttpMethod.DELETE.matches(method);
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
