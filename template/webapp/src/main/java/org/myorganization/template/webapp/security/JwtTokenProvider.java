package org.myorganization.template.webapp.security;

import java.nio.charset.StandardCharsets;
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

    /**
     * Default signing secret shipped by previous revisions of the repository. It is public
     * knowledge, so anyone could forge valid tokens with it; using it is therefore rejected.
     */
    private static final String INSECURE_DEFAULT_SECRET =
            "default-secret-key-for-development-only-change-in-production-min-32-chars";

    /** HS256 requires an HMAC key of at least 256 bits. */
    private static final int MIN_SECRET_BYTES = 32;

    private final SecretKey secretKey;
    private final long accessTokenExpiration;

    public JwtTokenProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token-expiration:900000}") long accessTokenExpiration) {
        this.secretKey = Keys.hmacShaKeyFor(validateSecret(secret));
        this.accessTokenExpiration = accessTokenExpiration;
    }

    /**
     * Validates the configured signing secret, so the application fails fast at startup
     * instead of silently signing tokens with an insecure key.
     *
     * @param secret raw value read from the {@code jwt.secret} property
     * @return the secret bytes to use as HMAC key
     * @throws IllegalStateException if the secret is missing, too short or the known default
     */
    private static byte[] validateSecret(String secret) {
        if (secret == null || secret.isBlank() || INSECURE_DEFAULT_SECRET.equals(secret)) {
            throw new IllegalStateException(
                    "Insecure 'jwt.secret': provide your own value through the JWT_SECRET environment variable. "
                            + "The default secret shipped in the repository is not allowed.");
        }
        byte[] secretBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                    "Invalid 'jwt.secret': it must be at least " + MIN_SECRET_BYTES
                            + " bytes long to be usable as an HS256 key.");
        }
        return secretBytes;
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
    public List<String> extractActions(String token) {
        Claims claims = extractClaims(token);
        List<?> actions = claims.get(CLAIM_ACTIONS, List.class);
        if (actions == null) {
            return List.of();
        }
        return actions.stream()
                .map(String.class::cast)
                .toList();
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
