package org.myorganization.template.domain.validation;

/**
 * Bean Validation group markers used to distinguish constraints that only apply
 * when creating an entity from those that also apply on updates.
 * <p>
 * DTOs such as {@code UserDTO} are reused for creation and update, but some
 * fields are only mandatory at creation time (for example, a password). By
 * assigning those constraints to {@link Create}, controllers can enable them
 * solely on the create endpoint while still validating the rest of the payload
 * with the default group.
 */
public final class ValidationGroups {

    private ValidationGroups() {
    }

    /**
     * Constraints that must hold only when creating a new entity.
     */
    public interface Create {
    }
}
