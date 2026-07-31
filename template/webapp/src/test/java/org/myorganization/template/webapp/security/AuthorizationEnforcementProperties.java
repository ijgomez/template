package org.myorganization.template.webapp.security;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;

import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.filter.OncePerRequestFilter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Property-based tests for authorization enforcement.
 * <p>
 * Validates that users without the required action for a protected endpoint
 * always receive 403 Forbidden. Uses jqwik to generate arbitrary action subsets
 * and verifies the security behavior through MockMvc with the JWT filter and an
 * authorization enforcement filter that replicates SecurityConfig rules.
 * <p>
 * <b>Validates: Requirements 5.4, 18.9</b>
 */
class AuthorizationEnforcementProperties {

    private static final List<String> ALL_ACTIONS = List.of(
            "DASHBOARD_READ", "REPORT_EXECUTE", "INTERFACES_READ",
            "USER_READ", "USER_WRITE", "PROFILE_READ", "PROFILE_WRITE",
            "ACTION_READ", "SYSTEM_PARAMETER_READ", "SYSTEM_PARAMETER_WRITE",
            "SYSTEM_LOG_READ", "CLUSTER_NODE_READ", "CLUSTER_NODE_WRITE",
            "CLUSTER_LOCK_READ"
    );

    private static final List<EndpointActionMapping> ENDPOINT_MAPPINGS = List.of(
            new EndpointActionMapping("/api/v1/administration/security/users", "GET",
                    Set.of("USER_READ", "USER_WRITE")),
            new EndpointActionMapping("/api/v1/administration/security/profiles", "GET",
                    Set.of("PROFILE_READ", "PROFILE_WRITE")),
            new EndpointActionMapping("/api/v1/administration/security/actions", "GET",
                    Set.of("ACTION_READ")),
            new EndpointActionMapping("/api/v1/administration/parameters", "GET",
                    Set.of("SYSTEM_PARAMETER_READ", "SYSTEM_PARAMETER_WRITE")),
            new EndpointActionMapping("/api/v1/administration/audit", "GET",
                    Set.of("SYSTEM_LOG_READ")),
            new EndpointActionMapping("/api/v1/administration/cluster/nodes", "GET",
                    Set.of("CLUSTER_NODE_READ", "CLUSTER_NODE_WRITE")),
            new EndpointActionMapping("/api/v1/reports", "GET",
                    Set.of("REPORT_EXECUTE"))
    );

    private static final String JWT_SECRET = "test-secret-key-for-property-testing-minimum-32-characters";

    private static final Map<String, Set<String>> PATH_TO_REQUIRED_ACTIONS = Map.of(
            "/api/v1/administration/security/users", Set.of("USER_READ", "USER_WRITE"),
            "/api/v1/administration/security/profiles", Set.of("PROFILE_READ", "PROFILE_WRITE"),
            "/api/v1/administration/security/actions", Set.of("ACTION_READ"),
            "/api/v1/administration/parameters", Set.of("SYSTEM_PARAMETER_READ", "SYSTEM_PARAMETER_WRITE"),
            "/api/v1/administration/audit", Set.of("SYSTEM_LOG_READ"),
            "/api/v1/administration/cluster/nodes", Set.of("CLUSTER_NODE_READ", "CLUSTER_NODE_WRITE"),
            "/api/v1/reports", Set.of("REPORT_EXECUTE")
    );

    private final JwtTokenProvider tokenProvider = new JwtTokenProvider(JWT_SECRET, 900000L, 604800000L);
    private final JwtAuthenticationFilter jwtFilter = new JwtAuthenticationFilter(tokenProvider);

    /**
     * Property 5: Authorization enforcement returns 403.
     * <p>
     * For any user with a set of actions that does NOT include the required action(s)
     * for an endpoint, accessing that endpoint returns 403 Forbidden.
     */
    @Property(tries = 200)
    void anyUserWithoutRequiredAction_shouldReceive403(
            @ForAll("actionsSubsetWithoutRequired") ActionSubsetAndEndpoint input) throws Exception {

        String token = tokenProvider.generateAccessToken("testuser", "TestProfile", input.userActions());
        MockMvc mockMvc = buildMockMvc();

        ResultActions result = mockMvc.perform(MockMvcRequestBuilders.get(input.mapping().path())
                .header("Authorization", "Bearer " + token)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isForbidden());
    }

    /**
     * Property 5 (positive counterpart): Authorization grants access with correct action.
     * <p>
     * For any user that HAS at least one required action, accessing the endpoint
     * does NOT return 403.
     */
    @Property(tries = 100)
    void anyUserWithRequiredAction_shouldNotReceive403(
            @ForAll("actionsSubsetWithRequired") ActionSubsetAndEndpoint input) throws Exception {

        String token = tokenProvider.generateAccessToken("testuser", "TestProfile", input.userActions());
        MockMvc mockMvc = buildMockMvc();

        ResultActions result = mockMvc.perform(MockMvcRequestBuilders.get(input.mapping().path())
                .header("Authorization", "Bearer " + token)
                .accept(MediaType.APPLICATION_JSON));

        int statusCode = result.andReturn().getResponse().getStatus();
        assertThat(statusCode).isNotEqualTo(403);
    }

    /**
     * Property 5 (report-specific): For any user without REPORT_EXECUTE action,
     * accessing report execution/export endpoints returns 403.
     */
    @Property(tries = 100)
    void anyUserWithoutReportExecute_shouldReceive403ForReportEndpoints(
            @ForAll("actionsWithoutReportExecute") List<String> userActions) throws Exception {

        String token = tokenProvider.generateAccessToken("testuser", "TestProfile", userActions);
        MockMvc mockMvc = buildMockMvc();

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/reports/1/execute")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/reports/1/export/PDF")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // Providers
    // =========================================================================

    @Provide
    Arbitrary<ActionSubsetAndEndpoint> actionsSubsetWithoutRequired() {
        return Arbitraries.of(ENDPOINT_MAPPINGS).flatMap(mapping -> {
            Set<String> forbidden = mapping.requiredActions();
            List<String> availableActions = ALL_ACTIONS.stream()
                    .filter(a -> !forbidden.contains(a))
                    .collect(Collectors.toList());
            return Arbitraries.subsetOf(availableActions)
                    .map(subset -> new ActionSubsetAndEndpoint(new ArrayList<>(subset), mapping));
        });
    }

    @Provide
    Arbitrary<ActionSubsetAndEndpoint> actionsSubsetWithRequired() {
        return Arbitraries.of(ENDPOINT_MAPPINGS).flatMap(mapping -> {
            Set<String> required = mapping.requiredActions();
            List<String> requiredList = new ArrayList<>(required);
            return Arbitraries.of(requiredList).flatMap(guaranteedAction -> {
                List<String> otherActions = ALL_ACTIONS.stream()
                        .filter(a -> !a.equals(guaranteedAction))
                        .collect(Collectors.toList());
                return Arbitraries.subsetOf(otherActions)
                        .map(subset -> {
                            List<String> actions = new ArrayList<>(subset);
                            if (!actions.contains(guaranteedAction)) {
                                actions.add(guaranteedAction);
                            }
                            return new ActionSubsetAndEndpoint(actions, mapping);
                        });
            });
        });
    }

    @Provide
    Arbitrary<List<String>> actionsWithoutReportExecute() {
        List<String> available = ALL_ACTIONS.stream()
                .filter(a -> !"REPORT_EXECUTE".equals(a))
                .collect(Collectors.toList());
        return Arbitraries.subsetOf(available).map(ArrayList::new);
    }

    // =========================================================================
    // Helper methods
    // =========================================================================

    private MockMvc buildMockMvc() {
        return MockMvcBuilders
                .standaloneSetup(new StubController())
                .addFilters(jwtFilter, new AuthorizationEnforcementFilter())
                .build();
    }

    // =========================================================================
    // Inner classes
    // =========================================================================

    record EndpointActionMapping(String path, String method, Set<String> requiredActions) {
    }

    record ActionSubsetAndEndpoint(List<String> userActions, EndpointActionMapping mapping) {
        @Override
        public String toString() {
            return "endpoint=" + mapping.method() + " " + mapping.path()
                    + ", userActions=" + userActions;
        }
    }

    /**
     * Filter that enforces authorization rules matching those in SecurityConfig.
     * <p>
     * This filter replicates the authorization behavior of Spring Security's
     * authorizeHttpRequests configuration so that property tests can validate
     * the intended access control without requiring a full Spring Boot context.
     */
    static class AuthorizationEnforcementFilter extends OncePerRequestFilter {

        @Override
        protected void doFilterInternal(HttpServletRequest request,
                                        HttpServletResponse response,
                                        FilterChain filterChain) throws ServletException, IOException {

            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            if (authentication == null || !authentication.isAuthenticated()) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                return;
            }

            String path = request.getRequestURI();
            Set<String> userAuthorities = authentication.getAuthorities().stream()
                    .map(a -> a.getAuthority())
                    .collect(Collectors.toSet());

            Set<String> requiredActions = findRequiredActions(path);

            if (requiredActions != null && !requiredActions.isEmpty()) {
                boolean hasAccess = requiredActions.stream().anyMatch(userAuthorities::contains);
                if (!hasAccess) {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.getWriter().write("{\"status\":403,\"error\":\"Forbidden\"}");
                    return;
                }
            }

            filterChain.doFilter(request, response);
        }

        private Set<String> findRequiredActions(String path) {
            if (path.startsWith("/api/v1/reports")) {
                return Set.of("REPORT_EXECUTE");
            }
            for (Map.Entry<String, Set<String>> entry : PATH_TO_REQUIRED_ACTIONS.entrySet()) {
                if (path.equals(entry.getKey()) || path.startsWith(entry.getKey() + "/")) {
                    return entry.getValue();
                }
            }
            return null;
        }
    }

    /**
     * Stub controller that provides endpoints for all tested paths.
     * Returns 200 OK for all requests - the authorization filter decides access.
     */
    @RestController
    static class StubController {

        @GetMapping("/api/v1/administration/security/users")
        public String users() {
            return "ok";
        }

        @GetMapping("/api/v1/administration/security/profiles")
        public String profiles() {
            return "ok";
        }

        @GetMapping("/api/v1/administration/security/actions")
        public String actions() {
            return "ok";
        }

        @GetMapping("/api/v1/administration/parameters")
        public String parameters() {
            return "ok";
        }

        @GetMapping("/api/v1/administration/audit")
        public String audit() {
            return "ok";
        }

        @GetMapping("/api/v1/administration/cluster/nodes")
        public String clusterNodes() {
            return "ok";
        }

        @GetMapping("/api/v1/reports")
        public String reports() {
            return "ok";
        }

        @PostMapping("/api/v1/reports/{id}/execute")
        public String executeReport() {
            return "ok";
        }

        @PostMapping("/api/v1/reports/{id}/export/{format}")
        public String exportReport() {
            return "ok";
        }
    }
}
