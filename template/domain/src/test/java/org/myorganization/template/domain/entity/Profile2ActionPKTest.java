package org.myorganization.template.domain.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for the {@link Profile2ActionPK} composite key contract
 * ({@code equals} / {@code hashCode}), which JPA relies on to identify rows.
 */
class Profile2ActionPKTest {

    @Test
    @DisplayName("Keys with the same profile and action ids are equal and share hashCode")
    void equalWhenSameComponents() {
        Profile2ActionPK a = new Profile2ActionPK(1L, 2L);
        Profile2ActionPK b = new Profile2ActionPK(1L, 2L);

        assertThat(a).isEqualTo(b);
        assertThat(a).hasSameHashCodeAs(b);
    }

    @Test
    @DisplayName("Keys differing in any component are not equal")
    void notEqualWhenComponentsDiffer() {
        Profile2ActionPK base = new Profile2ActionPK(1L, 2L);

        assertThat(base).isNotEqualTo(new Profile2ActionPK(9L, 2L));
        assertThat(base).isNotEqualTo(new Profile2ActionPK(1L, 9L));
    }

    @Test
    @DisplayName("equals is reflexive, null-safe and type-safe")
    void equalsContractEdgeCases() {
        Profile2ActionPK key = new Profile2ActionPK(1L, 2L);

        assertThat(key).isEqualTo(key);
        assertThat(key).isNotEqualTo(null);
        assertThat(key).isNotEqualTo("not-a-key");
    }

    @Test
    @DisplayName("Two default-constructed keys are equal (both components null)")
    void defaultKeysAreEqual() {
        assertThat(new Profile2ActionPK()).isEqualTo(new Profile2ActionPK());
    }

    @Test
    @DisplayName("Accessors round-trip profile and action ids")
    void accessorsRoundTrip() {
        Profile2ActionPK key = new Profile2ActionPK();
        key.setProfileId(5L);
        key.setActionId(7L);

        assertThat(key.getProfileId()).isEqualTo(5L);
        assertThat(key.getActionId()).isEqualTo(7L);
    }
}
