package org.myorganization.template.domain.dto;

/**
 * Response object containing authentication tokens.
 *
 * @param accessToken  JWT access token
 * @param refreshToken JWT refresh token
 */
public record TokenResponse(
        String accessToken,
        String refreshToken
) {
}
