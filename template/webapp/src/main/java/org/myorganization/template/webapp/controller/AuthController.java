package org.myorganization.template.webapp.controller;

import org.myorganization.template.core.service.AuthService;
import org.myorganization.template.domain.dto.LoginRequest;
import org.myorganization.template.domain.dto.TokenResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

/**
 * REST controller for authentication operations.
 * <p>
 * Exposes endpoints for login, token refresh and logout.
 * All endpoints are publicly accessible (configured in SecurityConfig).
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Authenticates a user and returns a token pair.
     *
     * @param loginRequest the login credentials
     * @return 200 OK with access and refresh tokens
     */
    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        TokenResponse tokenResponse = authService.authenticate(loginRequest);
        return ResponseEntity.ok(tokenResponse);
    }

    /**
     * Refreshes the token pair using a valid refresh token.
     *
     * @param request the refresh token request
     * @return 200 OK with new access and refresh tokens
     */
    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        TokenResponse tokenResponse = authService.refreshToken(request.refreshToken());
        return ResponseEntity.ok(tokenResponse);
    }

    /**
     * Invalidates a refresh token (logout).
     *
     * @param request the refresh token request
     * @return 200 OK
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@Valid @RequestBody RefreshTokenRequest request) {
        authService.logout(request.refreshToken());
        return ResponseEntity.ok().build();
    }

}
