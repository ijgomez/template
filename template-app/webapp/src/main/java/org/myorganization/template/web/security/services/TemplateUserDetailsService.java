package org.myorganization.template.web.security.services;

import java.util.Optional;

import org.myorganization.template.core.domain.security.users.User;
import org.myorganization.template.core.services.security.UserService;
import org.myorganization.template.web.security.model.TemplateUserDetails;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class TemplateUserDetailsService implements UserDetailsService {

	@Autowired
	private UserService userRepository;

	@Override
	public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
		Optional<User> user = userRepository.findByUsername(username);

		if (user.isPresent()) {
			return new TemplateUserDetails(user.get());
		}

		throw new UsernameNotFoundException("User not found with username: " + username);

	}
}
