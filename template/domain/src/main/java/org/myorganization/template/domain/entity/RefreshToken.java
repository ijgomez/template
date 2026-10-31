package org.myorganization.template.domain.entity;

import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;

import lombok.Getter;
import lombok.Setter;

/**
 * Represents a persistent refresh token associated with a user.
 * <p>
 * Uses an opaque token (UUID) stored in the database for server-side
 * validation and revocation. The token is delivered to the client via
 * an HttpOnly cookie and never exposed to JavaScript.
 */
@Entity
@Table(name = "refresh_token")
@Getter
@Setter
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "refresh_token_gen")
    @SequenceGenerator(name = "refresh_token_gen", sequenceName = "refresh_token_seq", allocationSize = 50)
    @Column(name = "id")
    private Long id;

    @Column(name = "token", nullable = false, unique = true)
    private String token;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "expires_at", nullable = false)
    private OffsetDateTime expiresAt;

    @Column(name = "revoked", nullable = false)
    private boolean revoked;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = OffsetDateTime.now(java.time.ZoneOffset.UTC);
        }
    }

    /**
     * Checks whether this token is expired.
     *
     * @return true if the token has expired
     */
    public boolean isExpired() {
        return OffsetDateTime.now(java.time.ZoneOffset.UTC).isAfter(this.expiresAt);
    }

    /**
     * Checks whether this token is usable (not revoked and not expired).
     *
     * @return true if the token is valid for use
     */
    public boolean isValid() {
        return !this.revoked && !isExpired();
    }
}
