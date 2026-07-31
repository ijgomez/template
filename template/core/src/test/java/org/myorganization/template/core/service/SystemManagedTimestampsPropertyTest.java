package org.myorganization.template.core.service;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Collections;
import java.util.Optional;

import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.Combinators;
import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.myorganization.template.core.repository.ProfileRepository;
import org.myorganization.template.core.repository.ReportRepository;
import org.myorganization.template.core.repository.User2ReportRepository;
import org.myorganization.template.core.repository.UserRepository;
import org.myorganization.template.domain.dto.UserDTO;
import org.myorganization.template.domain.entity.User;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

/**
 * Property-based test verifying that system-managed timestamps are read-only.
 *
 * <p><b>Validates: Requirements 34.4, 34.5, 34.6</b></p>
 *
 * <p>Property 16: For any create/update request with client-provided
 * created_at/last_modified_at values, the system ignores them and sets its own values
 * via JPA lifecycle callbacks ({@code @PrePersist} / {@code @PreUpdate}).</p>
 *
 * <p>Feature: template-app, Property 16: System-managed timestamps are read-only</p>
 */
class SystemManagedTimestampsPropertyTest {

    private final UserRepository userRepository = Mockito.mock(UserRepository.class);
    private final ProfileRepository profileRepository = Mockito.mock(ProfileRepository.class);
    private final ReportRepository reportRepository = Mockito.mock(ReportRepository.class);
    private final User2ReportRepository user2ReportRepository = Mockito.mock(User2ReportRepository.class);
    private final PasswordEncoder passwordEncoder = Mockito.mock(PasswordEncoder.class);

    private final UserService userService = new UserService(
            userRepository, profileRepository, reportRepository,
            user2ReportRepository, passwordEncoder);

    /**
     * Property: For any valid user creation request with arbitrary client-provided
     * createdAt and lastModifiedAt values, the service never passes those client values
     * to the persisted entity — the entity's timestamps remain null before JPA callbacks
     * (which will set them on actual persistence).
     */
    @Property(tries = 100)
    void createIgnoresClientProvidedTimestamps(
            @ForAll("userDTOsWithTimestamps") UserDTO inputDto) {

        // Precondition: client provided at least one timestamp
        if (inputDto.createdAt() == null && inputDto.lastModifiedAt() == null) {
            return;
        }

        // Arrange
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$12$encodedHash");

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        when(userRepository.save(userCaptor.capture())).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(1L);
            user.setUserReports(Collections.emptyList());
            return user;
        });

        // Act
        userService.create(inputDto);

        // Assert: the entity passed to repository.save() does NOT carry the client timestamps.
        // BaseEntity fields are only set by @PrePersist — the service must never copy them from DTO.
        User savedEntity = userCaptor.getValue();
        assertThat(savedEntity.getCreatedAt())
                .as("Service must not set createdAt from client DTO (value was: %s)", inputDto.createdAt())
                .isNull();
        assertThat(savedEntity.getLastModifiedAt())
                .as("Service must not set lastModifiedAt from client DTO (value was: %s)", inputDto.lastModifiedAt())
                .isNull();

        // Reset for next iteration
        Mockito.reset(userRepository, profileRepository, reportRepository,
                user2ReportRepository, passwordEncoder);
    }

    /**
     * Property: For any valid user update request with arbitrary client-provided
     * createdAt and lastModifiedAt values, the service does not overwrite the existing
     * entity's timestamps — they remain as they were before the update.
     */
    @Property(tries = 100)
    void updateIgnoresClientProvidedTimestamps(
            @ForAll("userDTOsWithTimestamps") UserDTO inputDto) {

        // Precondition: client provided at least one timestamp
        if (inputDto.createdAt() == null && inputDto.lastModifiedAt() == null) {
            return;
        }

        // Arrange: existing user with system-managed timestamps
        OffsetDateTime originalCreatedAt = OffsetDateTime.of(2020, 1, 1, 0, 0, 0, 0, ZoneOffset.UTC);
        OffsetDateTime originalLastModifiedAt = OffsetDateTime.of(2024, 6, 15, 12, 0, 0, 0, ZoneOffset.UTC);

        User existingUser = new User();
        existingUser.setId(42L);
        existingUser.setUsername("existinguser");
        existingUser.setPassword("$2a$12$existingHash");
        existingUser.setFirstName("Original");
        existingUser.setLastName("User");
        existingUser.setEmail("original@test.com");
        existingUser.setCreatedAt(originalCreatedAt);
        existingUser.setLastModifiedAt(originalLastModifiedAt);
        existingUser.setUserReports(Collections.emptyList());

        when(userRepository.findById(42L)).thenReturn(Optional.of(existingUser));

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        when(userRepository.save(userCaptor.capture())).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setUserReports(Collections.emptyList());
            return user;
        });

        // Act
        userService.update(42L, inputDto);

        // Assert: the entity passed to repository.save() retains its original timestamps,
        // regardless of what the client sent in the DTO.
        User savedEntity = userCaptor.getValue();
        assertThat(savedEntity.getCreatedAt())
                .as("Service must not overwrite createdAt with client value: %s", inputDto.createdAt())
                .isEqualTo(originalCreatedAt);
        assertThat(savedEntity.getLastModifiedAt())
                .as("Service must not overwrite lastModifiedAt with client value: %s", inputDto.lastModifiedAt())
                .isEqualTo(originalLastModifiedAt);

        // Reset for next iteration
        Mockito.reset(userRepository, profileRepository, reportRepository,
                user2ReportRepository, passwordEncoder);
    }

    /**
     * Property: The returned DTO from create/update carries the system-managed
     * timestamps, not the client-provided ones. Specifically, for create the timestamps
     * come from the persisted entity (set by JPA callbacks), and for update they are
     * the entity's existing values (to be refreshed by @PreUpdate on actual flush).
     */
    @Property(tries = 100)
    void returnedDtoTimestampsAreSystemManagedNotClientProvided(
            @ForAll("userDTOsWithTimestamps") UserDTO inputDto) {

        // Precondition: client provided at least one timestamp
        if (inputDto.createdAt() == null && inputDto.lastModifiedAt() == null) {
            return;
        }

        // Arrange
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$12$encodedHash");

        // Simulate JPA setting timestamps on save (as @PrePersist would)
        OffsetDateTime systemCreatedAt = OffsetDateTime.now(ZoneOffset.UTC);
        OffsetDateTime systemLastModifiedAt = systemCreatedAt;

        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(1L);
            user.setCreatedAt(systemCreatedAt);
            user.setLastModifiedAt(systemLastModifiedAt);
            user.setUserReports(Collections.emptyList());
            return user;
        });

        // Act
        UserDTO result = userService.create(inputDto);

        // Assert: returned timestamps are system-set, NOT the client-provided values
        assertThat(result.createdAt())
                .as("Returned createdAt must be system-managed, not client value: %s", inputDto.createdAt())
                .isEqualTo(systemCreatedAt);
        assertThat(result.lastModifiedAt())
                .as("Returned lastModifiedAt must be system-managed, not client value: %s", inputDto.lastModifiedAt())
                .isEqualTo(systemLastModifiedAt);

        // The returned timestamps must differ from client-provided values (except by coincidence)
        // We verify the system sets its own by checking they equal our simulated system values
        assertThat(result.createdAt()).isNotEqualTo(inputDto.createdAt());

        // Reset for next iteration
        Mockito.reset(userRepository, profileRepository, reportRepository,
                user2ReportRepository, passwordEncoder);
    }

    @Provide
    Arbitrary<UserDTO> userDTOsWithTimestamps() {
        Arbitrary<String> usernames = Arbitraries.strings()
                .alpha()
                .ofMinLength(3)
                .ofMaxLength(30);

        Arbitrary<String> passwords = Arbitraries.strings()
                .ascii()
                .ofMinLength(6)
                .ofMaxLength(20);

        Arbitrary<String> firstNames = Arbitraries.strings()
                .alpha()
                .ofMinLength(1)
                .ofMaxLength(30);

        Arbitrary<String> lastNames = Arbitraries.strings()
                .alpha()
                .ofMinLength(1)
                .ofMaxLength(30);

        Arbitrary<String> emails = Arbitraries.strings()
                .alpha()
                .ofMinLength(3)
                .ofMaxLength(15)
                .map(s -> s + "@test.com");

        // Generate arbitrary past timestamps that a client might send
        Arbitrary<OffsetDateTime> timestamps = Arbitraries.longs()
                .between(946684800L, 1893456000L) // 2000-01-01 to 2030-01-01 in epoch seconds
                .map(epoch -> OffsetDateTime.ofInstant(
                        java.time.Instant.ofEpochSecond(epoch), ZoneOffset.UTC));

        // At least one timestamp is always non-null
        Arbitrary<OffsetDateTime> createdAts = timestamps;
        Arbitrary<OffsetDateTime> lastModifiedAts = timestamps.injectNull(0.3);

        return Combinators.combine(usernames, passwords, firstNames, lastNames, emails,
                        createdAts, lastModifiedAts)
                .as((username, password, firstName, lastName, email, createdAt, lastModifiedAt) ->
                        new UserDTO(null, username, password, firstName, lastName, email,
                                null, null, null, Collections.emptyList(),
                                createdAt, lastModifiedAt));
    }
}
