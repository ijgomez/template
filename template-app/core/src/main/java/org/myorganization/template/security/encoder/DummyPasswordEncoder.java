package org.myorganization.template.security.encoder;

import org.springframework.security.crypto.password.PasswordEncoder;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class DummyPasswordEncoder implements PasswordEncoder {

	@Override
	public String encode(CharSequence rawPassword) {
		return rawPassword.toString();
	}

	@Override
	public boolean matches(CharSequence rawPassword, String encodedPassword) {
		if (rawPassword == null) {
			throw new IllegalArgumentException("rawPassword cannot be null");
		}
		if (encodedPassword == null || encodedPassword.length() == 0) {
			log.warn("Empty encoded password");
			return false;
		}
		
		return rawPassword.toString().equals(encodedPassword);
	}

}
