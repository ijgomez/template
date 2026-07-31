package org.myorganization.template.domain.exception;

/**
 * Thrown when authentication fails (invalid credentials or expired token).
 * <p>
 * Maps to HTTP 401 Unauthorized.
 */
public class AuthenticationException extends RuntimeException {

    private static final long serialVersionUID = 1954726032452845159L;

	public AuthenticationException(String message) {
        super(message);
    }

}
