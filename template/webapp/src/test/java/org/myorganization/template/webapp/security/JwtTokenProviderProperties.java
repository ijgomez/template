package org.myorganization.template.webapp.security;

import java.util.List;

import net.jqwik.api.*;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Property-based tests for {@link JwtTokenProvider}.
 * <p>
 * Validates: Requirements 5.1
 */
class JwtTokenProviderProperties {

    private static final String SECRET = "test-secret-key-that-is-at-least-32-characters-long";
    private static final long ACCESS_TOKEN_EXPIRATION = 900_000L;
    private static final long REFRESH_TOKEN_EXPIRATION = 604_800_000L;

    private static final List<String> ALL_ACTION_CODES = List.of(
            "DASHBOARD_READ",
            "REPORT_EXECUTE",
            "INTERFACES_READ",
            "USER_READ",
            "USER_WRITE",
            "PROFILE_READ",
            "PROFILE_WRITE",
            "ACTION_READ",
            "SYSTEM_PARAMETER_READ",
            "SYSTEM_PARAMETER_WRITE",
            "SYSTEM_LOG_READ",
            "CLUSTER_NODE_READ",
            "CLUSTER_NODE_WRITE",
            "CLUSTER_LOCK_READ"
    );

    private final JwtTokenProvider jwtTokenProvider =
            new JwtTokenProvider(SECRET, ACCESS_TOKEN_EXPIRATION, REFRESH_TOKEN_EXPIRATION);

    /**
     * Property 4: JWT payload contains user authorization data.
     * <p>
     * For any authenticated user with profile and actions, decoded JWT payload yields
     * profile name and complete action codes list.
     * <p>
     * <b>Validates: Requirements 5.1</b>
     */
    @Property
    void jwtPayloadContainsUserAuthorizationData(
            @ForAll("usernames") String username,
            @ForAll("profileNames") String profileName,
            @ForAll("actionCodeSubsets") List<String> actionCodes) {

        // Generate the access token
        String token = jwtTokenProvider.generateAccessToken(username, profileName, actionCodes);

        // Verify the token is valid
        assertThat(jwtTokenProvider.validateToken(token)).isTrue();

        // Verify the payload contains the profile name
        assertThat(jwtTokenProvider.extractProfile(token)).isEqualTo(profileName);

        // Verify the payload contains the complete list of action codes
        assertThat(jwtTokenProvider.extractActions(token))
                .containsExactlyElementsOf(actionCodes);

        // Verify the username (subject) is correctly set
        assertThat(jwtTokenProvider.extractUsername(token)).isEqualTo(username);
    }

    @Provide
    Arbitrary<String> usernames() {
        return Arbitraries.strings()
                .alpha()
                .ofMinLength(3)
                .ofMaxLength(50);
    }

    @Provide
    Arbitrary<String> profileNames() {
        return Arbitraries.of(
                "Administrator",
                "Operator",
                "Viewer",
                "Manager",
                "Auditor",
                "Support",
                "Developer"
        );
    }

    @Provide
    Arbitrary<List<String>> actionCodeSubsets() {
        return Arbitraries.of(ALL_ACTION_CODES)
                .list()
                .ofMinSize(0)
                .ofMaxSize(ALL_ACTION_CODES.size())
                .uniqueElements();
    }

}
