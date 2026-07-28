package org.myorganization.template.domain.exception;

/**
 * Thrown when a disallowed operation is attempted
 * (e.g., create/delete actions, create/delete nodes, CUD on read-only resources).
 * <p>
 * Maps to HTTP 405 Method Not Allowed.
 */
public class MethodNotAllowedException extends RuntimeException {

    public MethodNotAllowedException(String message) {
        super(message);
    }

}
