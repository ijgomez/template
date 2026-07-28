package org.myorganization.template.core.service;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.myorganization.template.core.repository.UserRepository;
import org.myorganization.template.core.security.TokenProvider;
import org.myorganization.template.domain.dto.LoginRequest;
import org.myorganization.template.domain.dto.TokenResponse;
import org.myorganization.template.domain.entity.Profile2Action;
import org.myorganization.template.domain.entity.User;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service handling authentication operations: login, token refresh and logout.
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenProvider tokenProvider;
    private final Set<String> invalidatedTokens = ConcurrentHashMap.newKeySet();

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       TokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    /**
     * Authenticates a user with the provided credentials.
     * <p>
     * Validates username and password, updates the user's lastAccess timestamp,
     * and generates a token pair (access + refresh).
     *
     * @param loginRequest the login credentials
     * @return a TokenResponse containing access and refresh tokens
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

        String profileName = user.getProfile() != null ? user.getProfile().getName() : "";
        List<String> actionCodes = getActionCodes(user);

        String accessToken = tokenProvider.generateAccessToken(
                user.getUsername(), profileName, actionCodes);
        String refreshToken = tokenProvider.generateRefreshToken(user.getUsername());

        return new TokenResponse(accessToken, refreshToken);
    }

    /**
     * Refreshes the token pair using a valid refresh token.
     * <p>
     * Validates the refresh token, extracts the username, and generates
     * a new token pair with the user's current profile and actions.
     *
     * @param refreshToken the refresh token
     * @return a new TokenResponse containing fresh access and refresh tokens
     * @throws BadCredentialsException if the refresh token is invalid or expired
     */
    @Transactional(readOnly = true)
    public TokenResponse refreshToken(String refreshToken) {
        if (!tokenProvider.validateToken(refreshToken)) {
            throw new BadCredentialsException("Invalid or expired refresh token");
        }

        if (!tokenProvider.isRefreshToken(refreshToken)) {
            throw new BadCredentialsException("Invalid or expired refresh token");
        }

        if (invalidatedTokens.contains(refreshToken)) {
            throw new BadCredentialsException("Invalid or expired refresh token");
        }

        String username = tokenProvider.extractUsername(refreshToken);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BadCredentialsException("Invalid or expired refresh token"));

        String profileName = user.getProfile() != null ? user.getProfile().getName() : "";
        List<String> actionCodes = getActionCodes(user);

        String newAccessToken = tokenProvider.generateAccessToken(
                username, profileName, actionCodes);
        String newRefreshToken = tokenProvider.generateRefreshToken(username);

        return new TokenResponse(newAccessToken, newRefreshToken);
    }

    /**
     * Invalidates a refresh token, preventing its future use.
     *
     * @param refreshToken the refresh token to invalidate
     */
    public void logout(String refreshToken) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            invalidatedTokens.add(refreshToken);
        }
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
