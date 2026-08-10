package org.myorganization.template.core.repository;

import java.util.Optional;

import org.myorganization.template.domain.entity.RefreshToken;
import org.myorganization.template.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for RefreshToken entity.
 */
@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    /**
     * Finds a refresh token by its opaque token value.
     *
     * @param token the opaque token string
     * @return an Optional containing the refresh token if found
     */
    Optional<RefreshToken> findByToken(String token);

    /**
     * Revokes all active refresh tokens for a given user.
     * Used during logout to invalidate all sessions.
     *
     * @param user the user whose tokens should be revoked
     * @return the number of tokens revoked
     */
    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revoked = true WHERE rt.user = :user AND rt.revoked = false")
    int revokeAllByUser(@Param("user") User user);

    /**
     * Deletes all expired or revoked tokens for cleanup purposes.
     *
     * @return the number of tokens deleted
     */
    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.revoked = true OR rt.expiresAt < CURRENT_TIMESTAMP")
    int deleteExpiredOrRevoked();
}
