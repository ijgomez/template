package org.myorganization.template.domain.exception;

/**
 * Thrown when an entity is not found by its identifier or unique key.
 * <p>
 * Maps to HTTP 404 Not Found.
 */
public class EntityNotFoundException extends RuntimeException {

    public EntityNotFoundException(String message) {
        super(message);
    }

    public EntityNotFoundException(String entityName, Object identifier) {
        super(entityName + " not found with id: " + identifier);
    }

}
