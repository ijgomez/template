package org.myorganization.template.webapp.controller;

import org.myorganization.template.core.service.AuthService;
import org.myorganization.template.domain.dto.LoginRequest;
import org.myorganization.template.domain.dto.TokenResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

/**
 * REST controller for authentication operations.
 * <p>
 * Exposes endpoints for login, token refresh and logout.
 * The refresh token is delivered and read via an HttpOnly cookie —
 * it is never exposed to client-side JavaScript.
 * All endpoints are publicly accessible (configured in SecurityConfig).
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final String cookieName;
    private final String cookiePath;
    private final long cookieMaxAge;
    private final boolean cookieSecure;
    private final String cookieSameSite;

    public AuthController(AuthService authService,
                          @Value("${auth.cookie.name:refresh-token}") String cookieName,
                          @Value("${auth.cookie.path:/template/api/v1/auth}") String cookiePath,
                          @Value("${auth.cookie.max-age-seconds:604800}") long cookieMaxAge,
                          @Value("${auth.cookie.secure:true}") boolean cookieSecure,
                          @Value("${auth.cookie.same-site:Strict}") String cookieSameSite) {
        this.authService = authService;
        this.cookieName = cookieName;
        this.cookiePath = cookiePath;
        this.cookieMaxAge = cookieMaxAge;
        this.cookieSecure = cookieSecure;
        this.cookieSameSite = cookieSameSite;
    }

    /**
     * Authenticates a user and returns the access token in the response body.
     * The refresh token is set as an HttpOnly cookie.
     *
     * @param loginRequest the login credentials
     * @return 200 OK with access token in body; refresh token in Set-Cookie header
     */
    @PostMapping("/login")
    public ResponseEntity<AccessTokenResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        TokenResponse tokenResponse = authService.authenticate(loginRequest);

        ResponseCookie cookie = buildRefreshTokenCookie(tokenResponse.refreshToken(), cookieMaxAge);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(new AccessTokenResponse(tokenResponse.accessToken()));
    }

    /**
     * Refreshes the token pair using the refresh token from the HttpOnly cookie.
     * Returns a new access token in the body and a rotated refresh token cookie.
     *
     * @param request the HTTP request containing the cookie
     * @return 200 OK with new access token; rotated refresh token in Set-Cookie header
     */
    @PostMapping("/refresh")
    public ResponseEntity<AccessTokenResponse> refresh(HttpServletRequest request) {
        String refreshToken = extractRefreshTokenFromCookie(request);

        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.status(401).build();
        }

        TokenResponse tokenResponse = authService.refreshToken(refreshToken);

        ResponseCookie cookie = buildRefreshTokenCookie(tokenResponse.refreshToken(), cookieMaxAge);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(new AccessTokenResponse(tokenResponse.accessToken()));
    }

    /**
     * Invalidates the refresh token and clears the cookie (logout).
     *
     * @param request the HTTP request containing the cookie
     * @return 200 OK with cleared cookie
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        String refreshToken = extractRefreshTokenFromCookie(request);

        if (refreshToken != null && !refreshToken.isBlank()) {
            authService.logout(refreshToken);
        }

        // Clear the cookie by setting maxAge to 0
        ResponseCookie clearCookie = buildRefreshTokenCookie("", 0);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearCookie.toString())
                .build();
    }

    /**
     * Extracts the refresh token value from the request cookies.
     */
    private String extractRefreshTokenFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (cookieName.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    /**
     * Builds the refresh token cookie with the configured security attributes.
     */
    private ResponseCookie buildRefreshTokenCookie(String value, long maxAge) {
        return ResponseCookie.from(cookieName, value)
                .httpOnly(true)
                .secure(cookieSecure)
                .path(cookiePath)
                .maxAge(maxAge)
                .sameSite(cookieSameSite)
                .build();
    }

    /**
     * Response containing only the access token.
     * The refresh token is never included in the response body.
     */
    public record AccessTokenResponse(String accessToken) {
    }
}
