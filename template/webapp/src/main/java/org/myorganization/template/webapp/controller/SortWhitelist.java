package org.myorganization.template.webapp.controller;

import java.util.List;
import java.util.Map;
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

    /**
     * Validates the sort of an already bound {@link Pageable} against an allowlist.
     * <p>
     * Spring binds {@code sort} to any property of the entity, so without this check a caller can
     * order by columns that are never returned (for example a password hash) and learn their order.
     *
     * @param pageable          the bound pageable
     * @param allowedProperties allowlist of properties that may be used for sorting
     * @return the same pageable when every sort property is allowed
     * @throws ValidationException if a requested sort property is not in the allowlist
     */
    static Pageable restrict(Pageable pageable, Set<String> allowedProperties) {
        return restrict(pageable, allowedProperties, Map.of());
    }

    /**
     * Same as {@link #restrict(Pageable, Set)}, additionally translating UI sort keys that do not
     * exist on the entity into the entity property to sort by (for example {@code profileName}
     * to {@code profile.name}).
     *
     * @param pageable          the bound pageable
     * @param allowedProperties allowlist of properties that may be used for sorting
     * @param aliases           UI sort key to entity property
     * @return a pageable whose sort uses only allowed entity properties
     * @throws ValidationException if a requested sort property is neither allowed nor an alias
     */
    static Pageable restrict(Pageable pageable, Set<String> allowedProperties, Map<String, String> aliases) {
        if (pageable.isUnpaged() || pageable.getSort().isUnsorted()) {
            return pageable;
        }
        List<Sort.Order> orders = pageable.getSort().stream().map(order -> {
            String property = aliases.getOrDefault(order.getProperty(), order.getProperty());
            if (!allowedProperties.contains(property)) {
                throw new ValidationException("Invalid sort property: " + order.getProperty());
            }
            return order.withProperty(property);
        }).toList();
        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(orders));
    }
}
