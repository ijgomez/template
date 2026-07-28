package org.myorganization.template.webapp.security;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for {@link JwtTokenProvider}.
 */
class JwtTokenProviderTest {

    private static final String SECRET = "test-secret-key-that-is-at-least-32-characters-long";
    private static final long ACCESS_TOKEN_EXPIRATION = 900_000L;
    private static final long REFRESH_TOKEN_EXPIRATION = 604_800_000L;

    private JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider(SECRET, ACCESS_TOKEN_EXPIRATION, REFRESH_TOKEN_EXPIRATION);
    }

    @Test
    void generateAccessToken_shouldReturnValidToken() {
        String token = jwtTokenProvider.generateAccessToken("admin", "Administrator", List.of("USER_READ", "USER_WRITE"));

        assertThat(token).isNotBlank();
        assertThat(jwtTokenProvider.validateToken(token)).isTrue();
    }

    @Test
    void generateAccessToken_shouldContainCorrectClaims() {
        List<String> actions = List.of("USER_READ", "PROFILE_READ", "DASHBOARD_READ");
        String token = jwtTokenProvider.generateAccessToken("testuser", "Operator", actions);

        assertThat(jwtTokenProvider.extractUsername(token)).isEqualTo("testuser");
        assertThat(jwtTokenProvider.extractProfile(token)).isEqualTo("Operator");
        assertThat(jwtTokenProvider.extractActions(token)).containsExactlyElementsOf(actions);
    }

    @Test
    void generateRefreshToken_shouldReturnValidToken() {
        String token = jwtTokenProvider.generateRefreshToken("admin");

        assertThat(token).isNotBlank();
        assertThat(jwtTokenProvider.validateToken(token)).isTrue();
    }

    @Test
    void generateRefreshToken_shouldContainUsernameOnly() {
        String token = jwtTokenProvider.generateRefreshToken("testuser");

        assertThat(jwtTokenProvider.extractUsername(token)).isEqualTo("testuser");
        assertThat(jwtTokenProvider.isRefreshToken(token)).isTrue();
    }

    @Test
    void isRefreshToken_shouldReturnFalseForAccessToken() {
        String token = jwtTokenProvider.generateAccessToken("admin", "Admin", List.of("USER_READ"));

        assertThat(jwtTokenProvider.isRefreshToken(token)).isFalse();
    }

    @Test
    void validateToken_shouldReturnFalseForInvalidToken() {
        assertThat(jwtTokenProvider.validateToken("invalid.token.here")).isFalse();
    }

    @Test
    void validateToken_shouldReturnFalseForTokenWithWrongSignature() {
        JwtTokenProvider otherProvider = new JwtTokenProvider(
                "another-secret-key-that-is-at-least-32-characters-long",
                ACCESS_TOKEN_EXPIRATION,
                REFRESH_TOKEN_EXPIRATION);

        String token = otherProvider.generateAccessToken("admin", "Admin", List.of("USER_READ"));

        assertThat(jwtTokenProvider.validateToken(token)).isFalse();
    }

    @Test
    void validateToken_shouldReturnFalseForExpiredToken() {
        JwtTokenProvider shortLivedProvider = new JwtTokenProvider(SECRET, 0L, 0L);

        String token = shortLivedProvider.generateAccessToken("admin", "Admin", List.of("USER_READ"));

        assertThat(jwtTokenProvider.validateToken(token)).isFalse();
    }

    @Test
    void validateToken_shouldReturnFalseForNullToken() {
        assertThat(jwtTokenProvider.validateToken(null)).isFalse();
    }

    @Test
    void validateToken_shouldReturnFalseForEmptyToken() {
        assertThat(jwtTokenProvider.validateToken("")).isFalse();
    }

    @Test
    void generateAccessToken_withEmptyActions_shouldWork() {
        String token = jwtTokenProvider.generateAccessToken("admin", "Admin", List.of());

        assertThat(jwtTokenProvider.validateToken(token)).isTrue();
        assertThat(jwtTokenProvider.extractActions(token)).isEmpty();
    }

}
