package org.myorganization.template.domain.exception;

/**
 * Thrown when a delete operation is blocked by referential integrity
 * (e.g., a profile cannot be deleted because it has assigned users).
 * <p>
 * Maps to HTTP 409 Conflict.
 */
public class EntityInUseException extends RuntimeException {

    public EntityInUseException(String message) {
        super(message);
    }

    public EntityInUseException(String entityName, Object identifier) {
        super(entityName + " with id " + identifier + " is in use and cannot be deleted");
    }

}
