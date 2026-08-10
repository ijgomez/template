package org.myorganization.template.webapp.security;

import java.time.Instant;
import java.util.Date;
import java.util.List;

import javax.crypto.SecretKey;

import org.myorganization.template.core.security.TokenProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

/**
 * Provides JWT access token generation, validation and claim extraction.
 * <p>
 * Access tokens include the user's profile name and action codes list in the payload.
 * Signing uses HMAC-SHA256.
 * <p>
 * Refresh tokens are no longer JWTs — they are opaque UUID tokens stored in the database.
 * The {@link #isRefreshToken(String)} method is retained to reject any legacy JWT
 * refresh tokens that might be presented as access tokens.
 */
@Component
public class JwtTokenProvider implements TokenProvider {

    private static final String CLAIM_PROFILE = "profile";
    private static final String CLAIM_ACTIONS = "actions";
    private static final String CLAIM_TYPE = "type";
    private static final String TOKEN_TYPE_ACCESS = "access";
    private static final String TOKEN_TYPE_REFRESH = "refresh";

    private final SecretKey secretKey;
    private final long accessTokenExpiration;

    public JwtTokenProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token-expiration:900000}") long accessTokenExpiration) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes());
        this.accessTokenExpiration = accessTokenExpiration;
    }

    /**
     * Generates an access token containing user authorization data.
     *
     * @param username    the username (subject)
     * @param profileName the user's profile name
     * @param actionCodes the list of action codes assigned to the user's profile
     * @return signed JWT access token
     */
    @Override
    public String generateAccessToken(String username, String profileName, List<String> actionCodes) {
        Instant now = Instant.now();
        Instant expiry = now.plusMillis(accessTokenExpiration);

        return Jwts.builder()
                .subject(username)
                .claim(CLAIM_PROFILE, profileName)
                .claim(CLAIM_ACTIONS, actionCodes)
                .claim(CLAIM_TYPE, TOKEN_TYPE_ACCESS)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(secretKey)
                .compact();
    }

    /**
     * Validates a token by verifying its signature and expiration.
     *
     * @param token the JWT token to validate
     * @return true if the token is valid, false otherwise
     */
    @Override
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * Extracts the username (subject) from a token.
     *
     * @param token the JWT token
     * @return the username
     */
    @Override
    public String extractUsername(String token) {
        return extractClaims(token).getSubject();
    }

    /**
     * Extracts the action codes list from an access token.
     *
     * @param token the JWT access token
     * @return list of action codes
     */
    @Override
    @SuppressWarnings("unchecked")
    public List<String> extractActions(String token) {
        Claims claims = extractClaims(token);
        return claims.get(CLAIM_ACTIONS, List.class);
    }

    /**
     * Extracts the profile name from an access token.
     *
     * @param token the JWT access token
     * @return the profile name
     */
    public String extractProfile(String token) {
        return extractClaims(token).get(CLAIM_PROFILE, String.class);
    }

    /**
     * Checks if a token is a refresh token (legacy JWT refresh tokens).
     * <p>
     * Since refresh tokens are now opaque UUIDs, this method is only used
     * to reject any legacy JWT refresh tokens presented as access tokens.
     *
     * @param token the JWT token
     * @return true if the token type is "refresh"
     */
    @Override
    public boolean isRefreshToken(String token) {
        try {
            return TOKEN_TYPE_REFRESH.equals(extractClaims(token).get(CLAIM_TYPE, String.class));
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

}
