package org.myorganization.template.domain.exception;

/**
 * Thrown when an entity is not found by its identifier or unique key.
 * <p>
 * Maps to HTTP 404 Not Found.
 */
public class EntityNotFoundException extends RuntimeException {

    private static final long serialVersionUID = 5799452148962909841L;

	public EntityNotFoundException(String message) {
        super(message);
    }

    public EntityNotFoundException(String entityName, Object identifier) {
        super(entityName + " not found with id: " + identifier);
    }

}
