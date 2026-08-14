package org.myorganization.template.core.service;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.myorganization.template.core.repository.RefreshTokenRepository;
import org.myorganization.template.core.repository.UserRepository;
import org.myorganization.template.core.security.TokenProvider;
import org.myorganization.template.domain.dto.LoginRequest;
import org.myorganization.template.domain.dto.TokenResponse;
import org.myorganization.template.domain.entity.Action;
import org.myorganization.template.domain.entity.Profile;
import org.myorganization.template.domain.entity.Profile2Action;
import org.myorganization.template.domain.entity.RefreshToken;
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
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private TokenProvider tokenProvider;

    @Mock
    private AuditService auditService;

    private AuthService authService;

    private static final long REFRESH_TOKEN_EXPIRATION = 604800000L; // 7 days

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, refreshTokenRepository,
                passwordEncoder, tokenProvider, auditService, REFRESH_TOKEN_EXPIRATION);
    }

    // ========== authenticate ==========

    @Test
    @DisplayName("authenticate: valid credentials returns access token and creates refresh token in DB")
    void authenticate_validCredentials_returnsTokenResponseAndPersistsRefreshToken() {
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
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));

        LoginRequest request = new LoginRequest("admin", "secret");
        TokenResponse response = authService.authenticate(request);

        assertThat(response.accessToken()).isEqualTo("access-token");
        assertThat(response.refreshToken()).isNotNull().isNotEmpty();
        assertThat(user.getLastAccess()).isNotNull();
        verify(userRepository).save(user);

        // Verify refresh token was persisted
        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).save(captor.capture());
        RefreshToken savedToken = captor.getValue();
        assertThat(savedToken.getToken()).isEqualTo(response.refreshToken());
        assertThat(savedToken.getUser()).isEqualTo(user);
        assertThat(savedToken.isRevoked()).isFalse();
        assertThat(savedToken.getExpiresAt()).isAfter(OffsetDateTime.now(ZoneOffset.UTC));
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
        verify(refreshTokenRepository, never()).save(any());
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
        verify(refreshTokenRepository, never()).save(any());
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
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));

        LoginRequest request = new LoginRequest("basic", "pass");
        TokenResponse response = authService.authenticate(request);

        assertThat(response.accessToken()).isEqualTo("access");
        assertThat(response.refreshToken()).isNotNull();
    }

    // ========== refreshToken ==========

    @Test
    @DisplayName("refreshToken: valid token returns new token pair and rotates refresh token")
    void refreshToken_validToken_returnsNewTokenPairAndRotates() {
        Profile profile = new Profile();
        profile.setName("ADMIN");
        profile.setProfileActions(Collections.emptyList());

        User user = new User();
        user.setUsername("admin");
        user.setProfile(profile);

        RefreshToken storedToken = new RefreshToken();
        storedToken.setToken("valid-refresh");
        storedToken.setUser(user);
        storedToken.setRevoked(false);
        storedToken.setExpiresAt(OffsetDateTime.now(ZoneOffset.UTC).plusDays(7));

        when(refreshTokenRepository.findByToken("valid-refresh")).thenReturn(Optional.of(storedToken));
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));
        when(tokenProvider.generateAccessToken(eq("admin"), eq("ADMIN"), eq(Collections.emptyList())))
                .thenReturn("new-access");

        TokenResponse response = authService.refreshToken("valid-refresh");

        assertThat(response.accessToken()).isEqualTo("new-access");
        assertThat(response.refreshToken()).isNotNull().isNotEqualTo("valid-refresh");

        // Old token should be revoked
        assertThat(storedToken.isRevoked()).isTrue();
    }

    @Test
    @DisplayName("refreshToken: token not found throws BadCredentialsException")
    void refreshToken_tokenNotFound_throwsBadCredentials() {
        when(refreshTokenRepository.findByToken("unknown")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.refreshToken("unknown"))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid or expired refresh token");
    }

    @Test
    @DisplayName("refreshToken: expired token throws BadCredentialsException")
    void refreshToken_expiredToken_throwsBadCredentials() {
        User user = new User();
        user.setUsername("admin");

        RefreshToken expiredToken = new RefreshToken();
        expiredToken.setToken("expired-refresh");
        expiredToken.setUser(user);
        expiredToken.setRevoked(false);
        expiredToken.setExpiresAt(OffsetDateTime.now(ZoneOffset.UTC).minusHours(1));

        when(refreshTokenRepository.findByToken("expired-refresh")).thenReturn(Optional.of(expiredToken));

        assertThatThrownBy(() -> authService.refreshToken("expired-refresh"))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid or expired refresh token");
    }

    @Test
    @DisplayName("refreshToken: revoked token throws BadCredentialsException and revokes all user tokens")
    void refreshToken_revokedToken_throwsAndRevokesAllUserTokens() {
        User user = new User();
        user.setUsername("admin");

        RefreshToken revokedToken = new RefreshToken();
        revokedToken.setToken("revoked-refresh");
        revokedToken.setUser(user);
        revokedToken.setRevoked(true);
        revokedToken.setExpiresAt(OffsetDateTime.now(ZoneOffset.UTC).plusDays(7));

        when(refreshTokenRepository.findByToken("revoked-refresh")).thenReturn(Optional.of(revokedToken));
        when(refreshTokenRepository.revokeAllByUser(user)).thenReturn(3);

        assertThatThrownBy(() -> authService.refreshToken("revoked-refresh"))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid or expired refresh token");

        // Should revoke all tokens for user (theft detection)
        verify(refreshTokenRepository).revokeAllByUser(user);
    }

    @Test
    @DisplayName("refreshToken: rotation generates new opaque UUID token")
    void refreshToken_rotation_generatesNewOpaqueToken() {
        Profile profile = new Profile();
        profile.setName("USER");
        profile.setProfileActions(Collections.emptyList());

        User user = new User();
        user.setUsername("user1");
        user.setProfile(profile);

        RefreshToken storedToken = new RefreshToken();
        storedToken.setToken("old-token");
        storedToken.setUser(user);
        storedToken.setRevoked(false);
        storedToken.setExpiresAt(OffsetDateTime.now(ZoneOffset.UTC).plusDays(7));

        when(refreshTokenRepository.findByToken("old-token")).thenReturn(Optional.of(storedToken));
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));
        when(tokenProvider.generateAccessToken(eq("user1"), eq("USER"), eq(Collections.emptyList())))
                .thenReturn("new-access");

        TokenResponse response = authService.refreshToken("old-token");

        // Verify two saves: one for revoking old, one for creating new
        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository, org.mockito.Mockito.times(2)).save(captor.capture());

        List<RefreshToken> savedTokens = captor.getAllValues();
        // First save: revoked old token
        assertThat(savedTokens.get(0).isRevoked()).isTrue();
        assertThat(savedTokens.get(0).getToken()).isEqualTo("old-token");
        // Second save: new token
        assertThat(savedTokens.get(1).isRevoked()).isFalse();
        assertThat(savedTokens.get(1).getToken()).isNotEqualTo("old-token");
        assertThat(savedTokens.get(1).getToken()).isEqualTo(response.refreshToken());
    }

    // ========== logout ==========

    @Test
    @DisplayName("logout: revokes all tokens for the user")
    void logout_revokesAllUserTokens() {
        User user = new User();
        user.setUsername("admin");

        RefreshToken token = new RefreshToken();
        token.setToken("my-refresh");
        token.setUser(user);
        token.setRevoked(false);
        token.setExpiresAt(OffsetDateTime.now(ZoneOffset.UTC).plusDays(7));

        when(refreshTokenRepository.findByToken("my-refresh")).thenReturn(Optional.of(token));
        when(refreshTokenRepository.revokeAllByUser(user)).thenReturn(1);

        authService.logout("my-refresh");

        verify(refreshTokenRepository).revokeAllByUser(user);
    }

    @Test
    @DisplayName("logout: null token does not cause error")
    void logout_nullToken_noError() {
        authService.logout(null);
        verify(refreshTokenRepository, never()).findByToken(anyString());
    }

    @Test
    @DisplayName("logout: blank token does not cause error")
    void logout_blankToken_noError() {
        authService.logout("   ");
        verify(refreshTokenRepository, never()).findByToken(anyString());
    }

    @Test
    @DisplayName("logout: unknown token does not cause error")
    void logout_unknownToken_noError() {
        when(refreshTokenRepository.findByToken("unknown")).thenReturn(Optional.empty());

        authService.logout("unknown");

        verify(refreshTokenRepository, never()).revokeAllByUser(any());
    }

    // ========== Configuration ==========

    @Test
    @DisplayName("refresh token expiration is applied when creating tokens")
    void refreshTokenExpiration_isAppliedOnCreation() {
        Profile profile = new Profile();
        profile.setName("ADMIN");
        profile.setProfileActions(Collections.emptyList());

        User user = new User();
        user.setUsername("admin");
        user.setPassword("$2a$12$hashed");
        user.setProfile(profile);

        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("pass", "$2a$12$hashed")).thenReturn(true);
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(tokenProvider.generateAccessToken(anyString(), anyString(), anyList())).thenReturn("token");
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));

        authService.authenticate(new LoginRequest("admin", "pass"));

        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).save(captor.capture());

        RefreshToken saved = captor.getValue();
        // Token should expire approximately 7 days from now
        OffsetDateTime expectedExpiry = OffsetDateTime.now(ZoneOffset.UTC).plusNanos(REFRESH_TOKEN_EXPIRATION * 1_000_000L);
        assertThat(saved.getExpiresAt()).isBetween(
                expectedExpiry.minusMinutes(1),
                expectedExpiry.plusMinutes(1));
    }
}
