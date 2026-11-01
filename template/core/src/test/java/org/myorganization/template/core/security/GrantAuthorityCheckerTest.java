package org.myorganization.template.core.security;

import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for {@link GrantAuthorityChecker} (SEC-07).
 */
class GrantAuthorityCheckerTest {

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("checkGrant: no security context (internal/test call) is allowed")
    void checkGrant_noContext_isAllowed() {
        SecurityContextHolder.clearContext();

        assertThatCode(() -> GrantAuthorityChecker.checkGrant(GrantAuthorityChecker.PROFILE_GRANT))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("checkGrant: anonymous authentication is denied")
    void checkGrant_anonymous_isDenied() {
        AnonymousAuthenticationToken anonymous = new AnonymousAuthenticationToken(
                "anonymous-key", "anonymousUser", List.of(new SimpleGrantedAuthority("ROLE_ANONYMOUS")));
        SecurityContextHolder.getContext().setAuthentication(anonymous);

        assertThatThrownBy(() -> GrantAuthorityChecker.checkGrant(GrantAuthorityChecker.USER_GRANT))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining(GrantAuthorityChecker.USER_GRANT);
    }

    @Test
    @DisplayName("checkGrant: authenticated without the grant authority is denied")
    void checkGrant_authenticatedWithoutAuthority_isDenied() {
        authenticateWith("USER_WRITE", "PROFILE_WRITE");

        assertThatThrownBy(() -> GrantAuthorityChecker.checkGrant(GrantAuthorityChecker.PROFILE_GRANT))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining(GrantAuthorityChecker.PROFILE_GRANT);
    }

    @Test
    @DisplayName("checkGrant: authenticated with the grant authority is allowed")
    void checkGrant_authenticatedWithAuthority_isAllowed() {
        authenticateWith("PROFILE_WRITE", GrantAuthorityChecker.PROFILE_GRANT);

        assertThatCode(() -> GrantAuthorityChecker.checkGrant(GrantAuthorityChecker.PROFILE_GRANT))
                .doesNotThrowAnyException();
    }

    private void authenticateWith(String... authorities) {
        List<SimpleGrantedAuthority> granted = Arrays.stream(authorities)
                .map(SimpleGrantedAuthority::new)
                .toList();
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken("admin", "n/a", granted);
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}
