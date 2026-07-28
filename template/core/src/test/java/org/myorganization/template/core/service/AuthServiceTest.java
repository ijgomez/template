package org.myorganization.template.core.service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.myorganization.template.core.repository.UserRepository;
import org.myorganization.template.core.security.TokenProvider;
import org.myorganization.template.domain.dto.LoginRequest;
import org.myorganization.template.domain.dto.TokenResponse;
import org.myorganization.template.domain.entity.Action;
import org.myorganization.template.domain.entity.Profile;
import org.myorganization.template.domain.entity.Profile2Action;
import org.myorganization.template.domain.entity.User;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private TokenProvider tokenProvider;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, passwordEncoder, tokenProvider);
    }

    @Test
    @DisplayName("authenticate: valid credentials returns token pair and updates lastAccess")
    void authenticate_validCredentials_returnsTokenResponse() {
        Profile profile = new Profile();
        profile.setName("ADMIN");

        Action action = new Action();
        action.setCode("USER_READ");
        Profile2Action p2a = new Profile2Action(profile, action);
        profile.setProfileActions(List.of(p2a));

        User user = new User();
        user.setUsername("admin");
        user.setPassword("$2a$12$hashedpassword");
        user.setProfile(profile);

        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret", "$2a$12$hashedpassword")).thenReturn(true);
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(tokenProvider.generateAccessToken(eq("admin"), eq("ADMIN"), eq(List.of("USER_READ"))))
                .thenReturn("access-token");
        when(tokenProvider.generateRefreshToken("admin")).thenReturn("refresh-token");

        LoginRequest request = new LoginRequest("admin", "secret");
        TokenResponse response = authService.authenticate(request);

        assertThat(response.accessToken()).isEqualTo("access-token");
        assertThat(response.refreshToken()).isEqualTo("refresh-token");
        assertThat(user.getLastAccess()).isNotNull();
        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("authenticate: invalid username throws BadCredentialsException")
    void authenticate_invalidUsername_throwsBadCredentials() {
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());

        LoginRequest request = new LoginRequest("unknown", "password");

        assertThatThrownBy(() -> authService.authenticate(request))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid username or password");

        verify(tokenProvider, never()).generateAccessToken(anyString(), anyString(), anyList());
    }

    @Test
    @DisplayName("authenticate: invalid password throws BadCredentialsException")
    void authenticate_invalidPassword_throwsBadCredentials() {
        User user = new User();
        user.setUsername("admin");
        user.setPassword("$2a$12$hashedpassword");

        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "$2a$12$hashedpassword")).thenReturn(false);

        LoginRequest request = new LoginRequest("admin", "wrong");

        assertThatThrownBy(() -> authService.authenticate(request))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid username or password");

        verify(userRepository, never()).save(any());
        verify(tokenProvider, never()).generateAccessToken(anyString(), anyString(), anyList());
    }

    @Test
    @DisplayName("refreshToken: valid refresh token returns new token pair")
    void refreshToken_validToken_returnsNewTokenPair() {
        Profile profile = new Profile();
        profile.setName("ADMIN");
        profile.setProfileActions(Collections.emptyList());

        User user = new User();
        user.setUsername("admin");
        user.setProfile(profile);

        when(tokenProvider.validateToken("valid-refresh")).thenReturn(true);
        when(tokenProvider.isRefreshToken("valid-refresh")).thenReturn(true);
        when(tokenProvider.extractUsername("valid-refresh")).thenReturn("admin");
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));
        when(tokenProvider.generateAccessToken(eq("admin"), eq("ADMIN"), eq(Collections.emptyList())))
                .thenReturn("new-access");
        when(tokenProvider.generateRefreshToken("admin")).thenReturn("new-refresh");

        TokenResponse response = authService.refreshToken("valid-refresh");

        assertThat(response.accessToken()).isEqualTo("new-access");
        assertThat(response.refreshToken()).isEqualTo("new-refresh");
    }

    @Test
    @DisplayName("refreshToken: invalid token throws BadCredentialsException")
    void refreshToken_invalidToken_throwsBadCredentials() {
        when(tokenProvider.validateToken("invalid")).thenReturn(false);

        assertThatThrownBy(() -> authService.refreshToken("invalid"))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid or expired refresh token");
    }

    @Test
    @DisplayName("refreshToken: access token (not refresh) throws BadCredentialsException")
    void refreshToken_accessTokenProvided_throwsBadCredentials() {
        when(tokenProvider.validateToken("access-token")).thenReturn(true);
        when(tokenProvider.isRefreshToken("access-token")).thenReturn(false);

        assertThatThrownBy(() -> authService.refreshToken("access-token"))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid or expired refresh token");
    }

    @Test
    @DisplayName("refreshToken: invalidated token throws BadCredentialsException")
    void refreshToken_invalidatedToken_throwsBadCredentials() {
        when(tokenProvider.validateToken("logout-token")).thenReturn(true);
        when(tokenProvider.isRefreshToken("logout-token")).thenReturn(true);

        authService.logout("logout-token");

        assertThatThrownBy(() -> authService.refreshToken("logout-token"))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid or expired refresh token");
    }

    @Test
    @DisplayName("logout: invalidates the refresh token")
    void logout_invalidatesToken() {
        when(tokenProvider.validateToken("my-refresh")).thenReturn(true);
        when(tokenProvider.isRefreshToken("my-refresh")).thenReturn(true);

        authService.logout("my-refresh");

        assertThatThrownBy(() -> authService.refreshToken("my-refresh"))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    @DisplayName("logout: null token does not cause error")
    void logout_nullToken_noError() {
        authService.logout(null);
        // No exception should be thrown
    }

    @Test
    @DisplayName("logout: blank token does not cause error")
    void logout_blankToken_noError() {
        authService.logout("   ");
        // No exception should be thrown
    }

    @Test
    @DisplayName("authenticate: user without profile generates token with empty profile and actions")
    void authenticate_userWithoutProfile_generatesTokenWithEmptyProfileAndActions() {
        User user = new User();
        user.setUsername("basic");
        user.setPassword("$2a$12$hashed");
        user.setProfile(null);

        when(userRepository.findByUsername("basic")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("pass", "$2a$12$hashed")).thenReturn(true);
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(tokenProvider.generateAccessToken(eq("basic"), eq(""), eq(Collections.emptyList())))
                .thenReturn("access");
        when(tokenProvider.generateRefreshToken("basic")).thenReturn("refresh");

        LoginRequest request = new LoginRequest("basic", "pass");
        TokenResponse response = authService.authenticate(request);

        assertThat(response.accessToken()).isEqualTo("access");
        assertThat(response.refreshToken()).isEqualTo("refresh");
    }
}
