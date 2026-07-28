package org.myorganization.template.domain.exception;

/**
 * Thrown when input validation fails (type mismatch, duplicates in lists,
 * missing required fields or filters).
 * <p>
 * Maps to HTTP 400 Bad Request.
 */
public class ValidationException extends RuntimeException {

    public ValidationException(String message) {
        super(message);
    }

}
