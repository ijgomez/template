package org.myorganization.template.webapp.security;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for {@link SecurityConfig}.
 */
@ExtendWith(MockitoExtension.class)
class SecurityConfigTest {

    @Mock
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    void passwordEncoder_shouldUseBCryptWithStrength12() {
        SecurityConfig config = new SecurityConfig(jwtAuthenticationFilter);
        PasswordEncoder encoder = config.passwordEncoder();

        assertThat(encoder).isInstanceOf(BCryptPasswordEncoder.class);

        String rawPassword = "testPassword123";
        String encoded = encoder.encode(rawPassword);

        assertThat(encoder.matches(rawPassword, encoded)).isTrue();
        assertThat(encoder.matches("wrongPassword", encoded)).isFalse();
        // BCrypt hash with strength 12 starts with $2a$12$
        assertThat(encoded).startsWith("$2a$12$");
    }

}
