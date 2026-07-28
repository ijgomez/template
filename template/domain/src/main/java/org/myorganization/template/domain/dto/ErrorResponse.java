package org.myorganization.template.domain.dto;

import java.time.Instant;

/**
 * Standard error response format for all API errors.
 * <p>
 * Provides a consistent JSON structure across all error scenarios.
 *
 * @param timestamp the time the error occurred (ISO 8601 UTC)
 * @param status    the HTTP status code
 * @param error     the HTTP status reason phrase
 * @param message   a descriptive error message
 * @param path      the request path that caused the error
 */
public record ErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path
) {

}
