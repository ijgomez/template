package org.myorganization.template.webapp.controller;

import jakarta.validation.constraints.NotBlank;

/**
 * Request object for token refresh and logout operations.
 *
 * @param refreshToken the refresh token
 */
public record RefreshTokenRequest(
        @NotBlank String refreshToken
) {
}
