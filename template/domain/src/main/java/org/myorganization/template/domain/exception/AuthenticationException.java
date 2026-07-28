package org.myorganization.template.domain.exception;

/**
 * Thrown when authentication fails (invalid credentials or expired token).
 * <p>
 * Maps to HTTP 401 Unauthorized.
 */
public class AuthenticationException extends RuntimeException {

    public AuthenticationException(String message) {
        super(message);
    }

}
