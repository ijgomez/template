package org.myorganization.template.webapp.security;

import java.util.List;

import org.myorganization.template.core.repository.UserRepository;
import org.myorganization.template.domain.entity.Profile2Action;
import org.myorganization.template.domain.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Loads users from the database for Spring Security's authentication providers.
 * <p>
 * Authorities are derived from the action codes granted to the user's profile.
 */
@Service
public class TemplateUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public TemplateUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsernameWithProfileActions(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        return new TemplateUserDetails(user, getAuthorities(user));
    }

    private List<GrantedAuthority> getAuthorities(User user) {
        if (user.getProfile() == null || user.getProfile().getProfileActions() == null) {
            return List.of();
        }
        return user.getProfile().getProfileActions().stream()
                .map(Profile2Action::getAction)
                .map(action -> (GrantedAuthority) new SimpleGrantedAuthority(action.getCode()))
                .toList();
    }

}
