package org.myorganization.template.domain.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for the {@link User2ReportPK} composite key contract
 * ({@code equals} / {@code hashCode}), which JPA relies on to identify rows.
 */
class User2ReportPKTest {

    @Test
    @DisplayName("Keys with the same user and report ids are equal and share hashCode")
    void equalWhenSameComponents() {
        User2ReportPK a = new User2ReportPK(1L, 2L);
        User2ReportPK b = new User2ReportPK(1L, 2L);

        assertThat(a).isEqualTo(b);
        assertThat(a).hasSameHashCodeAs(b);
    }

    @Test
    @DisplayName("Keys differing in any component are not equal")
    void notEqualWhenComponentsDiffer() {
        User2ReportPK base = new User2ReportPK(1L, 2L);

        assertThat(base).isNotEqualTo(new User2ReportPK(9L, 2L));
        assertThat(base).isNotEqualTo(new User2ReportPK(1L, 9L));
    }

    @Test
    @DisplayName("equals is reflexive, null-safe and type-safe")
    void equalsContractEdgeCases() {
        User2ReportPK key = new User2ReportPK(1L, 2L);

        assertThat(key).isEqualTo(key);
        assertThat(key).isNotEqualTo(null);
        assertThat(key).isNotEqualTo("not-a-key");
    }

    @Test
    @DisplayName("Two default-constructed keys are equal (both components null)")
    void defaultKeysAreEqual() {
        assertThat(new User2ReportPK()).isEqualTo(new User2ReportPK());
    }

    @Test
    @DisplayName("Accessors round-trip user and report ids")
    void accessorsRoundTrip() {
        User2ReportPK key = new User2ReportPK();
        key.setUserId(5L);
        key.setReportId(7L);

        assertThat(key.getUserId()).isEqualTo(5L);
        assertThat(key.getReportId()).isEqualTo(7L);
    }
}
