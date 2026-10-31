package org.myorganization.template.core.service;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import org.myorganization.template.core.repository.RefreshTokenRepository;
import org.myorganization.template.core.repository.UserRepository;
import org.myorganization.template.core.security.TokenProvider;
import org.myorganization.template.domain.dto.AuditLogEntry;
import org.myorganization.template.domain.dto.LoginRequest;
import org.myorganization.template.domain.dto.TokenResponse;
import org.myorganization.template.domain.entity.RefreshToken;
import org.myorganization.template.domain.entity.User;
import org.myorganization.template.domain.enums.AuditSection;
import org.myorganization.template.domain.enums.OperationType;
import org.myorganization.template.domain.exception.AccountLockedException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service handling authentication operations: login, token refresh and logout.
 * <p>
 * Refresh tokens are opaque UUID strings persisted in the database, supporting
 * server-side revocation and rotation. Access tokens remain as JWTs.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuthenticationManager authenticationManager;
    private final LoginAttemptService loginAttemptService;
    private final TokenProvider tokenProvider;
    private final AuditService auditService;

    @Value("${jwt.refresh-token-expiration:604800000}")
    private final long refreshTokenExpiration;

    /**
     * Authenticates a user with the provided credentials.
     * <p>
     * Delegates credential verification to Spring Security. Consecutive failures are
     * counted per account and, once the configured threshold is reached, the account is
     * locked for a configurable window: further attempts fail fast with
     * {@link AccountLockedException} (HTTP 429) even if the password is correct.
     *
     * @param loginRequest the login credentials
     * @return a TokenResponse containing the access token and opaque refresh token
     * @throws BadCredentialsException if the credentials are invalid
     * @throws AccountLockedException  if the account is temporarily locked
     */
    @Transactional
    public TokenResponse authenticate(LoginRequest loginRequest) {
        String username = loginRequest.username();

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, loginRequest.password()));
        } catch (LockedException ex) {
            throw new AccountLockedException(
                    "Account is temporarily locked due to repeated failed login attempts",
                    Math.max(1L, loginAttemptService.remainingLockSeconds(username)));
        } catch (BadCredentialsException ex) {
            loginAttemptService.registerFailure(username);
            throw ex;
        }

        User user = userRepository.findByUsernameWithProfileActions(username)
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

        // Clear the failure counter (committed in its own transaction) BEFORE touching the
        // user row: a full entity save here would rewrite the login-lock columns with the
        // stale values read by this transaction and undo the reset.
        loginAttemptService.resetFailures(username);
        userRepository.updateLastAccess(username, OffsetDateTime.now(ZoneOffset.UTC));

        String accessToken = generateAccessTokenForUser(user);
        String refreshToken = createRefreshToken(user);

        try {
            auditService.log(new AuditLogEntry(
                    user.getUsername(), OperationType.EXECUTE, AuditSection.SECURITY,
                    user.getId() != null ? user.getId().toString() : null, "User",
                    "Login successful"));
        } catch (Exception e) {
            log.error("Failed to record login audit for user {}: {}", user.getUsername(), e.getMessage());
        }

        return new TokenResponse(accessToken, refreshToken);
    }

    /**
     * Refreshes the token pair using a valid opaque refresh token.
     * <p>
     * Validates the refresh token against the database, checks it is not expired
     * or revoked, then performs token rotation: the old token is revoked and a
     * new one is created. Updates the user's lastAccess timestamp.
     *
     * @param refreshTokenValue the opaque refresh token string
     * @return a new TokenResponse containing a fresh access token and rotated
     *         refresh token
     * @throws BadCredentialsException if the refresh token is invalid, expired or
     *                                 revoked
     */
    @Transactional
    public TokenResponse refreshToken(String refreshTokenValue) {
        RefreshToken storedToken = refreshTokenRepository.findByToken(refreshTokenValue)
                .orElseThrow(() -> new BadCredentialsException("Invalid or expired refresh token"));

        if (!storedToken.isValid()) {
            // If a revoked token is reused, revoke ALL tokens for that user (possible
            // theft)
            if (storedToken.isRevoked()) {
                refreshTokenRepository.revokeAllByUser(storedToken.getUser());
            }
            throw new BadCredentialsException("Invalid or expired refresh token");
        }

        // Rotate: revoke the current token
        storedToken.setRevoked(true);
        refreshTokenRepository.save(storedToken);

        // Generate new token pair — reload user with full profile/actions graph
        User user = userRepository.findByUsernameWithProfileActions(storedToken.getUser().getUsername())
                .orElseThrow(() -> new BadCredentialsException("Invalid or expired refresh token"));

        // Update lastAccess on each successful token refresh
        user.setLastAccess(OffsetDateTime.now(ZoneOffset.UTC));
        userRepository.save(user);

        String accessToken = generateAccessTokenForUser(user);
        String newRefreshToken = createRefreshToken(user);

        return new TokenResponse(accessToken, newRefreshToken);
    }

    /**
     * Invalidates a refresh token and revokes all tokens for the user (logout).
     *
     * @param refreshTokenValue the opaque refresh token to invalidate
     */
    @Transactional
    public void logout(String refreshTokenValue) {
        if (refreshTokenValue == null || refreshTokenValue.isBlank()) {
            return;
        }

        // Revoke all tokens for this user to ensure full logout
        refreshTokenRepository.findByToken(refreshTokenValue)
                .ifPresent(token -> refreshTokenRepository.revokeAllByUser(token.getUser()));
    }

    /**
     * Generates a JWT access token for the given user with their current profile
     * and actions.
     */
    private String generateAccessTokenForUser(User user) {
        String profileName = user.getProfile() != null ? user.getProfile().getName() : "";
        List<String> actionCodes = getActionCodes(user);
        return tokenProvider.generateAccessToken(user.getUsername(), profileName, actionCodes);
    }

    /**
     * Creates a new opaque refresh token, persists it in the database,
     * and returns the token string value.
     */
    private String createRefreshToken(User user) {
        String tokenValue = UUID.randomUUID().toString();

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken(tokenValue);
        refreshToken.setUser(user);
        refreshToken.setExpiresAt(OffsetDateTime.now(ZoneOffset.UTC).plusNanos(refreshTokenExpiration * 1_000_000L));
        refreshToken.setRevoked(false);

        refreshTokenRepository.save(refreshToken);
        return tokenValue;
    }

    private List<String> getActionCodes(User user) {
        if (user.getProfile() == null || user.getProfile().getProfileActions() == null) {
            return Collections.emptyList();
        }
        return user.getProfile().getProfileActions().stream()
                .map(pa -> pa.getAction().getCode())
                .toList();
    }
}
