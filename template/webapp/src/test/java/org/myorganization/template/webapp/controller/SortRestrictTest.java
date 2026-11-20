package org.myorganization.template.webapp.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.myorganization.template.domain.exception.ValidationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

class SortRestrictTest {

    private static final Set<String> ALLOWED = Set.of("username", "profile.name");

    @Test
    @DisplayName("restrict: unsorted pageable is returned unchanged")
    void unsorted_isUnchanged() {
        Pageable pageable = PageRequest.of(0, 10);
        assertThat(SortWhitelist.restrict(pageable, ALLOWED)).isSameAs(pageable);
    }

    @Test
    @DisplayName("restrict: allowed property keeps page, size and direction")
    void allowed_keepsPaging() {
        Pageable pageable = PageRequest.of(2, 25, Sort.by(Sort.Direction.DESC, "username"));
        Pageable result = SortWhitelist.restrict(pageable, ALLOWED);
        assertThat(result.getPageNumber()).isEqualTo(2);
        assertThat(result.getPageSize()).isEqualTo(25);
        assertThat(result.getSort().getOrderFor("username").getDirection()).isEqualTo(Sort.Direction.DESC);
    }

    @Test
    @DisplayName("restrict: a property that is not allowed (password) is rejected")
    void notAllowed_isRejected() {
        Pageable pageable = PageRequest.of(0, 10, Sort.by("password"));
        assertThatThrownBy(() -> SortWhitelist.restrict(pageable, ALLOWED))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("password");
    }

    @Test
    @DisplayName("restrict: one disallowed property among several is rejected")
    void oneNotAllowed_isRejected() {
        Pageable pageable = PageRequest.of(0, 10, Sort.by("username").and(Sort.by("failedLoginAttempts")));
        assertThatThrownBy(() -> SortWhitelist.restrict(pageable, ALLOWED))
                .isInstanceOf(ValidationException.class);
    }

    @Test
    @DisplayName("restrict: alias is translated to the entity property")
    void alias_isTranslated() {
        Pageable pageable = PageRequest.of(0, 10, Sort.by("profileName"));
        Pageable result = SortWhitelist.restrict(pageable, ALLOWED, Map.of("profileName", "profile.name"));
        assertThat(result.getSort().getOrderFor("profile.name")).isNotNull();
    }

    @Test
    @DisplayName("restrict: a raw entity path that is not allowed cannot be reached through an alias")
    void alias_doesNotWidenAllowlist() {
        Pageable pageable = PageRequest.of(0, 10, Sort.by("profile.users.password"));
        assertThatThrownBy(() -> SortWhitelist.restrict(pageable, ALLOWED, Map.of("profileName", "profile.name")))
                .isInstanceOf(ValidationException.class);
    }
}
