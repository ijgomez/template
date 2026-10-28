package org.myorganization.template.webapp.security;

import java.io.Serial;
import java.util.Collection;
import java.util.List;

import org.myorganization.template.domain.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

/**
 * Adapts the {@link User} entity to Spring Security's {@link UserDetails} contract.
 * <p>
 * Account status is derived from the entity: an account temporarily locked after too
 * many failed logins reports {@link #isAccountNonLocked()} as {@code false}, which makes
 * Spring Security reject the authentication with a {@code LockedException}.
 */
public class TemplateUserDetails implements UserDetails {

    @Serial
    private static final long serialVersionUID = 1L;

    private final transient User user;
    private final List<GrantedAuthority> authorities;

    public TemplateUserDetails(User user, List<GrantedAuthority> authorities) {
        this.user = user;
        this.authorities = List.copyOf(authorities);
    }

    /**
     * Returns the underlying user entity.
     *
     * @return the user entity
     */
    public User getUser() {
        return user;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return user.getPassword();
    }

    @Override
    public String getUsername() {
        return user.getUsername();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return !user.isLocked();
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

}
