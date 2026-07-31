package org.myorganization.template.domain.exception;

/**
 * Thrown when a disallowed operation is attempted
 * (e.g., create/delete actions, create/delete nodes, CUD on read-only resources).
 * <p>
 * Maps to HTTP 405 Method Not Allowed.
 */
public class MethodNotAllowedException extends RuntimeException {

    private static final long serialVersionUID = -6868705943738035409L;

	public MethodNotAllowedException(String message) {
        super(message);
    }

}
