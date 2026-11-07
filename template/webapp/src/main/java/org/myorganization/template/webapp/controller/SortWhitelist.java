package org.myorganization.template.webapp.controller;

import java.util.Set;

import org.myorganization.template.domain.exception.ValidationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/**
 * Builds a {@link Pageable} from raw pagination parameters, validating the requested
 * sort property against a per-entity allowlist (SEC-10).
 * <p>
 * Rejecting properties that are not explicitly allowed prevents Spring Data from
 * throwing {@code PropertyReferenceException} when a client orders by an arbitrary
 * or non-exposed column, returning a controlled 400 instead of an uncontrolled 500.
 */
final class SortWhitelist {

    private SortWhitelist() {
    }

    /**
     * Builds a pageable honoring an optional {@code sort} parameter.
     *
     * @param page              zero-indexed page number
     * @param size              page size
     * @param sort              sort string in format "field,direction" (e.g. "name,desc"); may be null/blank
     * @param allowedProperties allowlist of properties that may be used for sorting
     * @return a pageable with the requested sorting, or an unsorted pageable when no sort is given
     * @throws ValidationException if the requested sort property is not in the allowlist
     */
    static Pageable buildPageable(int page, int size, String sort, Set<String> allowedProperties) {
        if (sort == null || sort.isBlank()) {
            return PageRequest.of(page, size);
        }
        String[] parts = sort.split(",");
        String property = parts[0].trim();
        if (!allowedProperties.contains(property)) {
            throw new ValidationException("Invalid sort property: " + property);
        }
        Sort.Direction direction = parts.length > 1 && "desc".equalsIgnoreCase(parts[1].trim())
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;
        return PageRequest.of(page, size, Sort.by(direction, property));
    }
}
