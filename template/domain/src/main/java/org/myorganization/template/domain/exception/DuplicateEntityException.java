package org.myorganization.template.domain.exception;

/**
 * Thrown when an entity creation or update violates a uniqueness constraint.
 * <p>
 * Maps to HTTP 409 Conflict.
 */
public class DuplicateEntityException extends RuntimeException {

    public DuplicateEntityException(String message) {
        super(message);
    }

    public DuplicateEntityException(String entityName, String field, Object value) {
        super(entityName + " already exists with " + field + ": " + value);
    }

}
