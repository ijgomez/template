package org.myorganization.template.domain.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request object for user authentication.
 *
 * @param username login username
 * @param password login password
 */
public record LoginRequest(
        @NotBlank String username,
        @NotBlank String password
) {
}
