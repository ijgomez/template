package org.myorganization.template.core.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.myorganization.template.core.repository.ActionRepository;
import org.myorganization.template.core.repository.Profile2ActionRepository;
import org.myorganization.template.core.repository.ProfileRepository;
import org.myorganization.template.domain.dto.ProfileDTO;
import org.myorganization.template.domain.exception.ValidationException;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Property-based test: Duplicate list item detection for Profiles.
 *
 * <p><b>Validates: Requirements 14.9</b></p>
 *
 * <p>Property 3: For any profile creation/update with duplicate actions in list,
 * the operation should always result in a 400 Bad Request (ValidationException).</p>
 */
@ExtendWith(MockitoExtension.class)
class ProfileServiceDuplicateActionsPropertyTest {

    @Mock
    private ProfileRepository profileRepository;

    @Mock
    private Profile2ActionRepository profile2ActionRepository;

    @Mock
    private ActionRepository actionRepository;

    /**
     * Generates a list of action IDs that always contains at least one duplicate.
     * Strategy: generate a base list of 1-20 IDs, then pick one at random and insert it again.
     */
    @Provide
    Arbitrary<List<Long>> actionIdsWithDuplicates() {
        return Arbitraries.longs().between(1L, 1000L)
                .list().ofMinSize(1).ofMaxSize(20)
                .flatMap(baseList -> Arbitraries.integers().between(0, baseList.size() - 1)
                        .map(duplicateIndex -> {
                            List<Long> result = new ArrayList<>(baseList);
                            // Insert a duplicate of the element at duplicateIndex
                            result.add(baseList.get(duplicateIndex));
                            // Shuffle to avoid the duplicate always being at the end
                            Collections.shuffle(result);
                            return result;
                        }));
    }

    @Property(tries = 100)
    void create_withDuplicateActions_alwaysThrowsValidationException(
            @ForAll("actionIdsWithDuplicates") List<Long> duplicateActionIds) {

        ProfileService profileService = new ProfileService(profileRepository,
                profile2ActionRepository, actionRepository);

        ProfileDTO dto = new ProfileDTO(null, "Test Profile", "A test profile",
                duplicateActionIds, null, null);

        assertThatThrownBy(() -> profileService.create(dto))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("duplicates");
    }

    @Property(tries = 100)
    void update_withDuplicateActions_alwaysThrowsValidationException(
            @ForAll("actionIdsWithDuplicates") List<Long> duplicateActionIds) {

        ProfileService profileService = new ProfileService(profileRepository,
                profile2ActionRepository, actionRepository);

        ProfileDTO dto = new ProfileDTO(1L, "Test Profile", "A test profile",
                duplicateActionIds, null, null);

        assertThatThrownBy(() -> profileService.update(1L, dto))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("duplicates");
    }
}
