package org.myorganization.template.webapp.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.myorganization.template.core.service.AuthService;
import org.myorganization.template.domain.dto.LoginRequest;
import org.myorganization.template.domain.dto.TokenResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.BadCredentialsException;

import jakarta.servlet.http.Cookie;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link AuthController}.
 */
class AuthControllerTest {

    private AuthService authService;
    private AuthController authController;

    private static final String COOKIE_NAME = "refresh-token";
    private static final String COOKIE_PATH = "/template/api/v1/auth";
    private static final long COOKIE_MAX_AGE = 604800L;
    private static final boolean COOKIE_SECURE = false;
    private static final String COOKIE_SAME_SITE = "Lax";

    @BeforeEach
    void setUp() {
        authService = mock(AuthService.class);
        authController = new AuthController(authService,
                COOKIE_NAME, COOKIE_PATH, COOKIE_MAX_AGE, COOKIE_SECURE, COOKIE_SAME_SITE);
    }

    @Test
    void login_withValidCredentials_shouldReturn200WithAccessTokenAndCookie() {
        LoginRequest loginRequest = new LoginRequest("admin", "password123");
        TokenResponse tokenResponse = new TokenResponse("access-token", "opaque-refresh-token");
        when(authService.authenticate(loginRequest)).thenReturn(tokenResponse);

        ResponseEntity<AuthController.AccessTokenResponse> response = authController.login(loginRequest);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().accessToken()).isEqualTo("access-token");

        // Verify Set-Cookie header
        String setCookie = response.getHeaders().getFirst(HttpHeaders.SET_COOKIE);
        assertThat(setCookie).isNotNull();
        assertThat(setCookie).contains(COOKIE_NAME + "=opaque-refresh-token");
        assertThat(setCookie).contains("HttpOnly");
        assertThat(setCookie).contains("Path=" + COOKIE_PATH);
        assertThat(setCookie).contains("Max-Age=" + COOKIE_MAX_AGE);
        assertThat(setCookie).contains("SameSite=" + COOKIE_SAME_SITE);

        verify(authService).authenticate(loginRequest);
    }

    @Test
    void login_withInvalidCredentials_shouldThrowBadCredentials() {
        LoginRequest loginRequest = new LoginRequest("admin", "wrong");
        when(authService.authenticate(loginRequest))
                .thenThrow(new BadCredentialsException("Invalid username or password"));

        assertThatThrownBy(() -> authController.login(loginRequest))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid username or password");
    }

    @Test
    void refresh_withValidCookie_shouldReturn200WithNewAccessTokenAndRotatedCookie() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie(COOKIE_NAME, "valid-refresh-token"));

        TokenResponse tokenResponse = new TokenResponse("new-access-token", "rotated-refresh-token");
        when(authService.refreshToken("valid-refresh-token")).thenReturn(tokenResponse);

        ResponseEntity<AuthController.AccessTokenResponse> response = authController.refresh(request);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().accessToken()).isEqualTo("new-access-token");

        // Verify rotated cookie
        String setCookie = response.getHeaders().getFirst(HttpHeaders.SET_COOKIE);
        assertThat(setCookie).contains(COOKIE_NAME + "=rotated-refresh-token");
        assertThat(setCookie).contains("HttpOnly");

        verify(authService).refreshToken("valid-refresh-token");
    }

    @Test
    void refresh_withNoCookie_shouldReturn401() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        // No cookies set

        ResponseEntity<AuthController.AccessTokenResponse> response = authController.refresh(request);

        assertThat(response.getStatusCode().value()).isEqualTo(401);
        assertThat(response.getBody()).isNull();
    }

    @Test
    void refresh_withInvalidToken_shouldThrowBadCredentials() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie(COOKIE_NAME, "invalid-token"));

        when(authService.refreshToken("invalid-token"))
                .thenThrow(new BadCredentialsException("Invalid or expired refresh token"));

        assertThatThrownBy(() -> authController.refresh(request))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid or expired refresh token");
    }

    @Test
    void logout_withValidCookie_shouldReturn200AndClearCookie() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie(COOKIE_NAME, "refresh-token-to-invalidate"));

        doNothing().when(authService).logout("refresh-token-to-invalidate");

        ResponseEntity<Void> response = authController.logout(request);

        assertThat(response.getStatusCode().value()).isEqualTo(200);

        // Verify cookie is cleared (maxAge=0)
        String setCookie = response.getHeaders().getFirst(HttpHeaders.SET_COOKIE);
        assertThat(setCookie).isNotNull();
        assertThat(setCookie).contains("Max-Age=0");

        verify(authService).logout("refresh-token-to-invalidate");
    }

    @Test
    void logout_withNoCookie_shouldReturn200WithClearedCookie() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        // No cookies

        ResponseEntity<Void> response = authController.logout(request);

        assertThat(response.getStatusCode().value()).isEqualTo(200);

        // Cookie should still be cleared
        String setCookie = response.getHeaders().getFirst(HttpHeaders.SET_COOKIE);
        assertThat(setCookie).isNotNull();
        assertThat(setCookie).contains("Max-Age=0");
    }

    @Test
    void login_cookieShouldNotBeSecureInLocalProfile() {
        LoginRequest loginRequest = new LoginRequest("admin", "password123");
        TokenResponse tokenResponse = new TokenResponse("access-token", "refresh");
        when(authService.authenticate(loginRequest)).thenReturn(tokenResponse);

        ResponseEntity<AuthController.AccessTokenResponse> response = authController.login(loginRequest);

        String setCookie = response.getHeaders().getFirst(HttpHeaders.SET_COOKIE);
        // In local profile (secure=false), cookie should NOT have Secure flag
        assertThat(setCookie).doesNotContain("Secure");
    }
}
