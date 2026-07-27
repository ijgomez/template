package org.myorganization.template.domain.entity;

import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;

/**
 * Base entity with common fields: id, createdAt, lastModifiedAt.
 * Uses JPA lifecycle callbacks for automatic timestamp management.
 */
@MappedSuperclass
public abstract class BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    @Column(name = "id")
    private Long id;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "last_modified_at", nullable = false)
    private OffsetDateTime lastModifiedAt;

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        this.createdAt = now;
        this.lastModifiedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.lastModifiedAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public OffsetDateTime getLastModifiedAt() {
        return lastModifiedAt;
    }

    public void setLastModifiedAt(OffsetDateTime lastModifiedAt) {
        this.lastModifiedAt = lastModifiedAt;
    }
}
