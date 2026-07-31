package org.myorganization.template.domain.exception;

/**
 * Thrown when an entity creation or update violates a uniqueness constraint.
 * <p>
 * Maps to HTTP 409 Conflict.
 */
public class DuplicateEntityException extends RuntimeException {

    private static final long serialVersionUID = 1363232062363792206L;

	public DuplicateEntityException(String message) {
        super(message);
    }

    public DuplicateEntityException(String entityName, String field, Object value) {
        super(entityName + " already exists with " + field + ": " + value);
    }

}
