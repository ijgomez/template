package org.myorganization.template.webapp.controller;

import java.util.Set;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.myorganization.template.domain.exception.ValidationException;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for {@link SortWhitelist} (SEC-10).
 * <p>
 * Verifies that only allowlisted sort properties are accepted, that an unknown
 * property yields a controlled {@link ValidationException} (mapped to 400) instead
 * of an uncontrolled server error, and that directions are parsed correctly.
 */
class SortWhitelistTest {

    private static final Set<String> ALLOWED = Set.of("id", "name", "createdAt");

    @Test
    @DisplayName("null sort returns an unsorted pageable")
    void buildPageable_withNullSort_returnsUnsorted() {
        Pageable pageable = SortWhitelist.buildPageable(0, 10, null, ALLOWED);

        assertThat(pageable.getPageNumber()).isZero();
        assertThat(pageable.getPageSize()).isEqualTo(10);
        assertThat(pageable.getSort().isSorted()).isFalse();
    }

    @Test
    @DisplayName("blank sort returns an unsorted pageable")
    void buildPageable_withBlankSort_returnsUnsorted() {
        Pageable pageable = SortWhitelist.buildPageable(0, 10, "   ", ALLOWED);

        assertThat(pageable.getSort().isSorted()).isFalse();
    }

    @Test
    @DisplayName("allowlisted property with explicit direction is applied")
    void buildPageable_withValidAscendingProperty_appliesSort() {
        Pageable pageable = SortWhitelist.buildPageable(0, 10, "name,asc", ALLOWED);

        Sort.Order order = pageable.getSort().getOrderFor("name");
        assertThat(order).isNotNull();
        assertThat(order.getDirection()).isEqualTo(Sort.Direction.ASC);
    }

    @Test
    @DisplayName("allowlisted property defaults to ascending when direction is omitted")
    void buildPageable_withoutDirection_defaultsToAscending() {
        Pageable pageable = SortWhitelist.buildPageable(0, 10, "createdAt", ALLOWED);

        Sort.Order order = pageable.getSort().getOrderFor("createdAt");
        assertThat(order).isNotNull();
        assertThat(order.getDirection()).isEqualTo(Sort.Direction.ASC);
    }

    @Test
    @DisplayName("descending direction is parsed case-insensitively")
    void buildPageable_withDescendingDirection_appliesDescending() {
        Pageable pageable = SortWhitelist.buildPageable(0, 10, "id,DESC", ALLOWED);

        Sort.Order order = pageable.getSort().getOrderFor("id");
        assertThat(order).isNotNull();
        assertThat(order.getDirection()).isEqualTo(Sort.Direction.DESC);
    }

    @Test
    @DisplayName("non-allowlisted property is rejected with a controlled ValidationException")
    void buildPageable_withUnknownProperty_throwsValidationException() {
        assertThatThrownBy(() -> SortWhitelist.buildPageable(0, 10, "campoInexistente,asc", ALLOWED))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("campoInexistente");
    }

    @Test
    @DisplayName("non-allowlisted property is rejected regardless of direction")
    void buildPageable_withUnknownPropertyAndDesc_throwsValidationException() {
        assertThatThrownBy(() -> SortWhitelist.buildPageable(0, 10, "password,desc", ALLOWED))
                .isInstanceOf(ValidationException.class);
    }

}
