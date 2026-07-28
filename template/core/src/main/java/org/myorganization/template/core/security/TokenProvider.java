package org.myorganization.template.core.security;

import java.util.List;

/**
 * Port interface for JWT token operations.
 * <p>
 * Defines the contract for token generation, validation and claim extraction.
 * Implementations reside in the webapp module (e.g. JwtTokenProvider),
 * allowing the core module to remain independent of JWT libraries.
 */
public interface TokenProvider {

    /**
     * Generates an access token containing user authorization data.
     *
     * @param username    the username (subject)
     * @param profileName the user's profile name
     * @param actionCodes the list of action codes assigned to the user's profile
     * @return signed JWT access token
     */
    String generateAccessToken(String username, String profileName, List<String> actionCodes);

    /**
     * Generates a refresh token with minimal claims and longer expiry.
     *
     * @param username the username (subject)
     * @return signed JWT refresh token
     */
    String generateRefreshToken(String username);

    /**
     * Validates a token by verifying its signature and expiration.
     *
     * @param token the JWT token to validate
     * @return true if the token is valid, false otherwise
     */
    boolean validateToken(String token);

    /**
     * Extracts the username (subject) from a token.
     *
     * @param token the JWT token
     * @return the username
     */
    String extractUsername(String token);

    /**
     * Extracts the action codes list from an access token.
     *
     * @param token the JWT access token
     * @return list of action codes
     */
    List<String> extractActions(String token);

    /**
     * Checks if a token is a refresh token.
     *
     * @param token the JWT token
     * @return true if the token type is "refresh"
     */
    boolean isRefreshToken(String token);
}
