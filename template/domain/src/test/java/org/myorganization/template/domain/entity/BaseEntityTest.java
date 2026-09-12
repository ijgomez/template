package org.myorganization.template.domain.entity;

import java.lang.reflect.Method;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for {@link BaseEntity} JPA lifecycle callbacks and accessors.
 *
 * <p>{@code onCreate} ({@code @PrePersist}) and {@code onUpdate} ({@code @PreUpdate})
 * are {@code protected}, so they are invoked here via reflection using a concrete
 * subclass, mirroring how JPA would trigger them.</p>
 */
class BaseEntityTest {

    /** Minimal concrete entity to instantiate the abstract {@link BaseEntity}. */
    private static final class TestEntity extends BaseEntity {
    }

    private static void invokeCallback(BaseEntity entity, String methodName) throws Exception {
        Method method = BaseEntity.class.getDeclaredMethod(methodName);
        method.setAccessible(true);
        method.invoke(entity);
    }

    @Test
    @DisplayName("onCreate sets createdAt and lastModifiedAt to the same UTC instant")
    void onCreateInitializesBothTimestampsInUtc() throws Exception {
        TestEntity entity = new TestEntity();
        OffsetDateTime before = OffsetDateTime.now(ZoneOffset.UTC);

        invokeCallback(entity, "onCreate");

        OffsetDateTime after = OffsetDateTime.now(ZoneOffset.UTC);

        assertThat(entity.getCreatedAt()).isNotNull();
        assertThat(entity.getLastModifiedAt()).isNotNull();
        assertThat(entity.getCreatedAt()).isEqualTo(entity.getLastModifiedAt());
        assertThat(entity.getCreatedAt().getOffset()).isEqualTo(ZoneOffset.UTC);
        assertThat(entity.getCreatedAt()).isBetween(before, after);
    }

    @Test
    @DisplayName("onUpdate refreshes lastModifiedAt without touching createdAt")
    void onUpdateRefreshesOnlyLastModifiedAt() throws Exception {
        TestEntity entity = new TestEntity();
        OffsetDateTime originalCreatedAt = OffsetDateTime.of(2020, 1, 1, 0, 0, 0, 0, ZoneOffset.UTC);
        OffsetDateTime originalLastModifiedAt = OffsetDateTime.of(2020, 1, 1, 0, 0, 0, 0, ZoneOffset.UTC);
        entity.setCreatedAt(originalCreatedAt);
        entity.setLastModifiedAt(originalLastModifiedAt);

        OffsetDateTime before = OffsetDateTime.now(ZoneOffset.UTC);
        invokeCallback(entity, "onUpdate");
        OffsetDateTime after = OffsetDateTime.now(ZoneOffset.UTC);

        assertThat(entity.getCreatedAt())
                .as("onUpdate must not modify createdAt")
                .isEqualTo(originalCreatedAt);
        assertThat(entity.getLastModifiedAt())
                .as("onUpdate must refresh lastModifiedAt")
                .isBetween(before, after)
                .isNotEqualTo(originalLastModifiedAt);
        assertThat(entity.getLastModifiedAt().getOffset()).isEqualTo(ZoneOffset.UTC);
    }

    @Test
    @DisplayName("Accessors round-trip id, createdAt and lastModifiedAt")
    void accessorsRoundTrip() {
        TestEntity entity = new TestEntity();
        OffsetDateTime createdAt = OffsetDateTime.of(2021, 5, 10, 8, 30, 0, 0, ZoneOffset.UTC);
        OffsetDateTime lastModifiedAt = OffsetDateTime.of(2022, 6, 11, 9, 45, 0, 0, ZoneOffset.UTC);

        entity.setId(99L);
        entity.setCreatedAt(createdAt);
        entity.setLastModifiedAt(lastModifiedAt);

        assertThat(entity.getId()).isEqualTo(99L);
        assertThat(entity.getCreatedAt()).isEqualTo(createdAt);
        assertThat(entity.getLastModifiedAt()).isEqualTo(lastModifiedAt);
    }
}
