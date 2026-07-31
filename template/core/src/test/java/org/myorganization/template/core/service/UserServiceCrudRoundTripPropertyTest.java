package org.myorganization.template.core.service;

import java.util.Collections;
import java.util.Optional;

import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.Combinators;
import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;
import org.mockito.Mockito;
import org.myorganization.template.core.repository.ProfileRepository;
import org.myorganization.template.core.repository.ReportRepository;
import org.myorganization.template.core.repository.User2ReportRepository;
import org.myorganization.template.core.repository.UserRepository;
import org.myorganization.template.domain.dto.UserDTO;
import org.myorganization.template.domain.entity.Profile;
import org.myorganization.template.domain.entity.User;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

/**
 * Property-based test verifying CRUD round-trip preserves entity data for Users.
 *
 * <p><b>Validates: Requirements 4.1, 4.3</b></p>
 *
 * <p>Property 1: For any valid user creation request, create then retrieve should return
 * equivalent fields (excluding system-generated fields like id, password, lastAccess,
 * createdAt, lastModifiedAt).</p>
 */
class UserServiceCrudRoundTripPropertyTest {

    private final UserRepository userRepository = Mockito.mock(UserRepository.class);
    private final ProfileRepository profileRepository = Mockito.mock(ProfileRepository.class);
    private final ReportRepository reportRepository = Mockito.mock(ReportRepository.class);
    private final User2ReportRepository user2ReportRepository = Mockito.mock(User2ReportRepository.class);
    private final PasswordEncoder passwordEncoder = Mockito.mock(PasswordEncoder.class);

    private final UserService userService = new UserService(
            userRepository, profileRepository, reportRepository,
            user2ReportRepository, passwordEncoder);

    @Property
    void crudRoundTripPreservesUserData(@ForAll("validUserDTOs") UserDTO inputDto) {
        // Arrange: configure mocks so create and findById succeed
        Profile profile = null;
        if (inputDto.profileId() != null) {
            profile = new Profile();
            profile.setId(inputDto.profileId());
            profile.setName("Profile_" + inputDto.profileId());
            when(profileRepository.findById(inputDto.profileId())).thenReturn(Optional.of(profile));
        }

        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$12$encodedHash");

        final Profile savedProfile = profile;
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(42L);
            user.setProfile(savedProfile);
            user.setUserReports(Collections.emptyList());
            return user;
        });

        // Act: create user
        UserDTO created = userService.create(inputDto);

        // Arrange for findById: return a User entity with the same data
        User storedUser = new User();
        storedUser.setId(42L);
        storedUser.setUsername(inputDto.username());
        storedUser.setPassword("$2a$12$encodedHash");
        storedUser.setFirstName(inputDto.firstName());
        storedUser.setLastName(inputDto.lastName());
        storedUser.setEmail(inputDto.email());
        storedUser.setProfile(savedProfile);
        storedUser.setUserReports(Collections.emptyList());
        when(userRepository.findById(42L)).thenReturn(Optional.of(storedUser));

        // Act: retrieve user
        UserDTO retrieved = userService.findById(42L);

        // Assert: non-system-generated fields match
        assertThat(retrieved.username()).isEqualTo(inputDto.username());
        assertThat(retrieved.firstName()).isEqualTo(inputDto.firstName());
        assertThat(retrieved.lastName()).isEqualTo(inputDto.lastName());
        assertThat(retrieved.email()).isEqualTo(inputDto.email());
        assertThat(retrieved.profileId()).isEqualTo(inputDto.profileId());

        // Password should never be exposed
        assertThat(retrieved.password()).isNull();

        // Round-trip: created and retrieved should have consistent non-system fields
        assertThat(retrieved.username()).isEqualTo(created.username());
        assertThat(retrieved.firstName()).isEqualTo(created.firstName());
        assertThat(retrieved.lastName()).isEqualTo(created.lastName());
        assertThat(retrieved.email()).isEqualTo(created.email());
        assertThat(retrieved.profileId()).isEqualTo(created.profileId());

        // Reset mocks for next iteration
        Mockito.reset(userRepository, profileRepository, reportRepository,
                user2ReportRepository, passwordEncoder);
    }

    @Provide
    Arbitrary<UserDTO> validUserDTOs() {
        Arbitrary<String> usernames = Arbitraries.strings()
                .alpha()
                .ofMinLength(3)
                .ofMaxLength(50);

        Arbitrary<String> passwords = Arbitraries.strings()
                .ascii()
                .ofMinLength(6)
                .ofMaxLength(30);

        Arbitrary<String> firstNames = Arbitraries.strings()
                .alpha()
                .ofMinLength(1)
                .ofMaxLength(50);

        Arbitrary<String> lastNames = Arbitraries.strings()
                .alpha()
                .ofMinLength(1)
                .ofMaxLength(50);

        Arbitrary<String> emails = Arbitraries.strings()
                .alpha()
                .ofMinLength(3)
                .ofMaxLength(20)
                .map(s -> s + "@test.com");

        Arbitrary<Long> profileIds = Arbitraries.longs()
                .between(1L, 100L)
                .injectNull(0.3);

        return Combinators.combine(usernames, passwords, firstNames, lastNames, emails, profileIds)
                .as((username, password, firstName, lastName, email, profileId) ->
                        new UserDTO(null, username, password, firstName, lastName, email,
                                null, profileId, null, Collections.emptyList(), null, null));
    }
}
