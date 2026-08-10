package org.myorganization.template.core.service;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import org.myorganization.template.core.repository.RefreshTokenRepository;
import org.myorganization.template.core.repository.UserRepository;
import org.myorganization.template.core.security.TokenProvider;
import org.myorganization.template.domain.dto.LoginRequest;
import org.myorganization.template.domain.dto.TokenResponse;
import org.myorganization.template.domain.entity.Profile2Action;
import org.myorganization.template.domain.entity.RefreshToken;
import org.myorganization.template.domain.entity.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service handling authentication operations: login, token refresh and logout.
 * <p>
 * Refresh tokens are opaque UUID strings persisted in the database, supporting
 * server-side revocation and rotation. Access tokens remain as JWTs.
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenProvider tokenProvider;
    private final long refreshTokenExpiration;

    public AuthService(UserRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder,
                       TokenProvider tokenProvider,
                       @Value("${jwt.refresh-token-expiration:604800000}") long refreshTokenExpiration) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.refreshTokenExpiration = refreshTokenExpiration;
    }

    /**
     * Authenticates a user with the provided credentials.
     * <p>
     * Validates username and password, updates the user's lastAccess timestamp,
     * generates a JWT access token and creates a persistent opaque refresh token.
     *
     * @param loginRequest the login credentials
     * @return a TokenResponse containing the access token and opaque refresh token
     * @throws BadCredentialsException if the credentials are invalid
     */
    @Transactional
    public TokenResponse authenticate(LoginRequest loginRequest) {
        User user = userRepository.findByUsername(loginRequest.username())
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

        if (!passwordEncoder.matches(loginRequest.password(), user.getPassword())) {
            throw new BadCredentialsException("Invalid username or password");
        }

        user.setLastAccess(OffsetDateTime.now(ZoneOffset.UTC));
        userRepository.save(user);

        String accessToken = generateAccessTokenForUser(user);
        String refreshToken = createRefreshToken(user);

        return new TokenResponse(accessToken, refreshToken);
    }

    /**
     * Refreshes the token pair using a valid opaque refresh token.
     * <p>
     * Validates the refresh token against the database, checks it is not expired
     * or revoked, then performs token rotation: the old token is revoked and a
     * new one is created.
     *
     * @param refreshTokenValue the opaque refresh token string
     * @return a new TokenResponse containing a fresh access token and rotated refresh token
     * @throws BadCredentialsException if the refresh token is invalid, expired or revoked
     */
    @Transactional
    public TokenResponse refreshToken(String refreshTokenValue) {
        RefreshToken storedToken = refreshTokenRepository.findByToken(refreshTokenValue)
                .orElseThrow(() -> new BadCredentialsException("Invalid or expired refresh token"));

        if (!storedToken.isValid()) {
            // If a revoked token is reused, revoke ALL tokens for that user (possible theft)
            if (storedToken.isRevoked()) {
                refreshTokenRepository.revokeAllByUser(storedToken.getUser());
            }
            throw new BadCredentialsException("Invalid or expired refresh token");
        }

        // Rotate: revoke the current token
        storedToken.setRevoked(true);
        refreshTokenRepository.save(storedToken);

        // Generate new token pair
        User user = storedToken.getUser();
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

        refreshTokenRepository.findByToken(refreshTokenValue).ifPresent(token -> {
            // Revoke all tokens for this user to ensure full logout
            refreshTokenRepository.revokeAllByUser(token.getUser());
        });
    }

    /**
     * Generates a JWT access token for the given user with their current profile and actions.
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
                .map(Profile2Action::getAction)
                .map(action -> action.getCode())
                .toList();
    }
}
