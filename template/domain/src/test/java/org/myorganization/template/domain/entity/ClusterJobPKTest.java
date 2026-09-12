package org.myorganization.template.domain.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for the {@link ClusterJobPK} composite key contract
 * ({@code equals} / {@code hashCode}), which JPA relies on to identify rows.
 */
class ClusterJobPKTest {

    @Test
    @DisplayName("Keys with the same node and task ids are equal and share hashCode")
    void equalWhenSameComponents() {
        ClusterJobPK a = new ClusterJobPK(1L, 2L);
        ClusterJobPK b = new ClusterJobPK(1L, 2L);

        assertThat(a).isEqualTo(b);
        assertThat(a).hasSameHashCodeAs(b);
    }

    @Test
    @DisplayName("Keys differing in any component are not equal")
    void notEqualWhenComponentsDiffer() {
        ClusterJobPK base = new ClusterJobPK(1L, 2L);

        assertThat(base).isNotEqualTo(new ClusterJobPK(9L, 2L));
        assertThat(base).isNotEqualTo(new ClusterJobPK(1L, 9L));
    }

    @Test
    @DisplayName("equals is reflexive, null-safe and type-safe")
    void equalsContractEdgeCases() {
        ClusterJobPK key = new ClusterJobPK(1L, 2L);

        assertThat(key).isEqualTo(key);
        assertThat(key).isNotEqualTo(null);
        assertThat(key).isNotEqualTo("not-a-key");
    }

    @Test
    @DisplayName("Two default-constructed keys are equal (both components null)")
    void defaultKeysAreEqual() {
        assertThat(new ClusterJobPK()).isEqualTo(new ClusterJobPK());
    }

    @Test
    @DisplayName("Accessors round-trip node and task ids")
    void accessorsRoundTrip() {
        ClusterJobPK key = new ClusterJobPK();
        key.setClusterNodeId(5L);
        key.setClusterTaskId(7L);

        assertThat(key.getClusterNodeId()).isEqualTo(5L);
        assertThat(key.getClusterTaskId()).isEqualTo(7L);
    }
}
