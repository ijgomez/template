package org.myorganization.template.core.service;

import java.util.Collections;

import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;
import org.mockito.Mockito;
import org.myorganization.template.core.repository.ActionRepository;
import org.myorganization.template.core.repository.Profile2ActionRepository;
import org.myorganization.template.core.repository.ProfileRepository;
import org.myorganization.template.domain.dto.ProfileDTO;
import org.myorganization.template.domain.exception.DuplicateEntityException;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Property-based test for uniqueness constraint enforcement on Profile creation.
 *
 * <p><b>Validates: Requirements 14.6</b></p>
 *
 * <p>Property 2: For any duplicate profile name, attempting to create a profile with an
 * already-existing name should always result in a DuplicateEntityException (409 Conflict).</p>
 */
class ProfileServiceUniquenessPropertyTest {

    @Property(tries = 100)
    void duplicateProfileName_alwaysThrowsDuplicateEntityException(
            @ForAll("validProfileNames") String profileName) {

        // Arrange: fresh mocks per trial
        ProfileRepository profileRepository = Mockito.mock(ProfileRepository.class);
        Profile2ActionRepository profile2ActionRepository = Mockito.mock(Profile2ActionRepository.class);
        ActionRepository actionRepository = Mockito.mock(ActionRepository.class);

        ProfileService profileService = new ProfileService(
                profileRepository, profile2ActionRepository, actionRepository);

        // Simulate that a profile with this name already exists
        when(profileRepository.existsByName(profileName)).thenReturn(true);

        // Build a valid creation DTO with the duplicate name
        ProfileDTO dto = new ProfileDTO(
                null,                    // id: null for creation
                profileName,             // duplicate name
                "Test description",      // description
                Collections.emptyList(), // actionIds
                null,                    // createdAt
                null                     // lastModifiedAt
        );

        // Act & Assert: creation must always throw DuplicateEntityException
        assertThatThrownBy(() -> profileService.create(dto))
                .isInstanceOf(DuplicateEntityException.class)
                .hasMessageContaining("name");

        // Verify the profile was never persisted
        verify(profileRepository, never()).save(Mockito.any());
    }

    @Provide
    Arbitrary<String> validProfileNames() {
        return Arbitraries.strings()
                .alpha()
                .numeric()
                .withChars(' ', '_', '-')
                .ofMinLength(1)
                .ofMaxLength(100);
    }
}
