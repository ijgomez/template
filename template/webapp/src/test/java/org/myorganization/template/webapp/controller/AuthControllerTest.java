package org.myorganization.template.webapp.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.myorganization.template.core.service.AuthService;
import org.myorganization.template.domain.dto.LoginRequest;
import org.myorganization.template.domain.dto.TokenResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;

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

    @BeforeEach
    void setUp() {
        authService = mock(AuthService.class);
        authController = new AuthController(authService);
    }

    @Test
    void login_withValidCredentials_shouldReturn200WithTokens() {
        LoginRequest loginRequest = new LoginRequest("admin", "password123");
        TokenResponse expectedResponse = new TokenResponse("access-token", "refresh-token");
        when(authService.authenticate(loginRequest)).thenReturn(expectedResponse);

        ResponseEntity<TokenResponse> response = authController.login(loginRequest);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().accessToken()).isEqualTo("access-token");
        assertThat(response.getBody().refreshToken()).isEqualTo("refresh-token");
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
    void refresh_withValidToken_shouldReturn200WithNewTokens() {
        RefreshTokenRequest request = new RefreshTokenRequest("valid-refresh-token");
        TokenResponse expectedResponse = new TokenResponse("new-access-token", "new-refresh-token");
        when(authService.refreshToken("valid-refresh-token")).thenReturn(expectedResponse);

        ResponseEntity<TokenResponse> response = authController.refresh(request);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().accessToken()).isEqualTo("new-access-token");
        assertThat(response.getBody().refreshToken()).isEqualTo("new-refresh-token");
        verify(authService).refreshToken("valid-refresh-token");
    }

    @Test
    void refresh_withInvalidToken_shouldThrowBadCredentials() {
        RefreshTokenRequest request = new RefreshTokenRequest("invalid-token");
        when(authService.refreshToken("invalid-token"))
                .thenThrow(new BadCredentialsException("Invalid or expired refresh token"));

        assertThatThrownBy(() -> authController.refresh(request))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid or expired refresh token");
    }

    @Test
    void logout_shouldReturn200() {
        RefreshTokenRequest request = new RefreshTokenRequest("refresh-token-to-invalidate");
        doNothing().when(authService).logout("refresh-token-to-invalidate");

        ResponseEntity<Void> response = authController.logout(request);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(authService).logout("refresh-token-to-invalidate");
    }

}
