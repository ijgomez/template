package org.myorganization.template.core.service;

import java.util.Collections;

import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;
import org.mockito.Mockito;
import org.myorganization.template.core.repository.ProfileRepository;
import org.myorganization.template.core.repository.ReportRepository;
import org.myorganization.template.core.repository.User2ReportRepository;
import org.myorganization.template.core.repository.UserRepository;
import org.myorganization.template.domain.dto.UserDTO;
import org.myorganization.template.domain.exception.DuplicateEntityException;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Property-based test for uniqueness constraint enforcement on User creation.
 *
 * <p><b>Validates: Requirements 4.6</b></p>
 *
 * <p>Property 2: For any duplicate username, attempting to create a user with an
 * already-existing username should always result in a DuplicateEntityException (409 Conflict).</p>
 */
class UserServiceUniquenessPropertyTest {

    @Property(tries = 100)
    void duplicateUsername_alwaysThrowsDuplicateEntityException(
            @ForAll("validUsernames") String username) {

        // Arrange: fresh mocks per trial
        UserRepository userRepository = Mockito.mock(UserRepository.class);
        ProfileRepository profileRepository = Mockito.mock(ProfileRepository.class);
        ReportRepository reportRepository = Mockito.mock(ReportRepository.class);
        User2ReportRepository user2ReportRepository = Mockito.mock(User2ReportRepository.class);
        PasswordEncoder passwordEncoder = Mockito.mock(PasswordEncoder.class);

        UserService userService = new UserService(
                userRepository, profileRepository, reportRepository,
                user2ReportRepository, passwordEncoder);

        // Simulate that a user with this username already exists
        when(userRepository.existsByUsername(username)).thenReturn(true);

        // Build a valid creation DTO with the duplicate username
        UserDTO dto = new UserDTO(
                null,           // id: null for creation
                username,       // duplicate username
                "P@ssw0rd123",  // password
                "FirstName",    // firstName
                "LastName",     // lastName
                "test@test.com",// email
                null,           // lastAccess
                null,           // profileId
                null,           // profileName
                Collections.emptyList(), // reportIds
                null,           // createdAt
                null            // lastModifiedAt
        );

        // Act & Assert: creation must always throw DuplicateEntityException
        assertThatThrownBy(() -> userService.create(dto))
                .isInstanceOf(DuplicateEntityException.class)
                .hasMessageContaining("username");

        // Verify the user was never persisted
        verify(userRepository, never()).save(Mockito.any());
    }

    @Provide
    Arbitrary<String> validUsernames() {
        return Arbitraries.strings()
                .alpha()
                .numeric()
                .withChars('_', '-', '.')
                .ofMinLength(3)
                .ofMaxLength(50);
    }
}
