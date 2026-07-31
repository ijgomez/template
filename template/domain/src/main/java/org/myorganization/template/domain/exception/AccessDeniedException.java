package org.myorganization.template.domain.exception;

/**
 * Thrown when a user lacks the required permissions for an operation.
 * <p>
 * Maps to HTTP 403 Forbidden.
 */
public class AccessDeniedException extends RuntimeException {

    private static final long serialVersionUID = 126670706047460177L;

	public AccessDeniedException(String message) {
        super(message);
    }

}
