package org.myorganization.template.core.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.Combinators;
import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;
import org.mockito.Mockito;
import org.myorganization.template.core.repository.ActionRepository;
import org.myorganization.template.core.repository.Profile2ActionRepository;
import org.myorganization.template.core.repository.ProfileRepository;
import org.myorganization.template.domain.dto.ProfileDTO;
import org.myorganization.template.domain.entity.Action;
import org.myorganization.template.domain.entity.Profile;
import org.myorganization.template.domain.entity.Profile2Action;
import org.myorganization.template.domain.entity.Profile2ActionPK;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

/**
 * Property-based test verifying CRUD round-trip preserves entity data for Profiles.
 *
 * <p><b>Validates: Requirements 14.1, 14.3</b></p>
 *
 * <p>Property 1: For any valid profile creation request, create then retrieve should return
 * equivalent fields (excluding system-generated fields like id, createdAt, lastModifiedAt).</p>
 */
class ProfileServiceCrudRoundTripPropertyTest {

    private final ProfileRepository profileRepository = Mockito.mock(ProfileRepository.class);
    private final Profile2ActionRepository profile2ActionRepository = Mockito.mock(Profile2ActionRepository.class);
    private final ActionRepository actionRepository = Mockito.mock(ActionRepository.class);

    private final ProfileService profileService = new ProfileService(
            profileRepository, profile2ActionRepository, actionRepository);

    @Property
    void crudRoundTripPreservesProfileData(@ForAll("validProfileDTOs") ProfileDTO inputDto) {
        // Arrange: configure mocks so create and findById succeed
        when(profileRepository.existsByName(anyString())).thenReturn(false);

        when(profileRepository.save(any(Profile.class))).thenAnswer(invocation -> {
            Profile profile = invocation.getArgument(0);
            profile.setId(99L);
            return profile;
        });

        // Mock action lookups for each action ID in the list
        for (Long actionId : inputDto.actionIds()) {
            Action action = new Action();
            action.setId(actionId);
            when(actionRepository.findById(actionId)).thenReturn(Optional.of(action));
        }

        when(profile2ActionRepository.save(any(Profile2Action.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act: create profile
        ProfileDTO created = profileService.create(inputDto);

        // Arrange for findById: return a Profile entity with the same data
        Profile storedProfile = new Profile();
        storedProfile.setId(99L);
        storedProfile.setName(inputDto.name());
        storedProfile.setDescription(inputDto.description());
        when(profileRepository.findById(99L)).thenReturn(Optional.of(storedProfile));

        // Mock profile2action lookups to return the same action IDs
        List<Profile2Action> storedAssociations = new ArrayList<>();
        for (Long actionId : inputDto.actionIds()) {
            Profile2Action p2a = new Profile2Action();
            p2a.setId(new Profile2ActionPK(99L, actionId));
            storedAssociations.add(p2a);
        }
        when(profile2ActionRepository.findByIdProfileId(99L)).thenReturn(storedAssociations);

        // Act: retrieve profile
        ProfileDTO retrieved = profileService.findById(99L);

        // Assert: non-system-generated fields match the input
        assertThat(retrieved.name()).isEqualTo(inputDto.name());
        assertThat(retrieved.description()).isEqualTo(inputDto.description());
        assertThat(retrieved.actionIds()).containsExactlyInAnyOrderElementsOf(inputDto.actionIds());

        // Round-trip: created and retrieved should have consistent non-system fields
        assertThat(retrieved.name()).isEqualTo(created.name());
        assertThat(retrieved.description()).isEqualTo(created.description());
        assertThat(retrieved.actionIds()).containsExactlyInAnyOrderElementsOf(created.actionIds());

        // Reset mocks for next iteration
        Mockito.reset(profileRepository, profile2ActionRepository, actionRepository);
    }

    @Provide
    Arbitrary<ProfileDTO> validProfileDTOs() {
        Arbitrary<String> names = Arbitraries.strings()
                .alpha()
                .ofMinLength(1)
                .ofMaxLength(50);

        Arbitrary<String> descriptions = Arbitraries.strings()
                .alpha()
                .ofMinLength(0)
                .ofMaxLength(200)
                .injectNull(0.2);

        Arbitrary<List<Long>> actionIdLists = Arbitraries.longs()
                .between(1L, 50L)
                .list()
                .ofMinSize(0)
                .ofMaxSize(5)
                .uniqueElements();

        return Combinators.combine(names, descriptions, actionIdLists)
                .as((name, description, actionIds) ->
                        new ProfileDTO(null, name, description, actionIds, null, null));
    }
}
