package org.myorganization.template.core.repository;

import java.time.OffsetDateTime;
import java.util.Optional;

import org.myorganization.template.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Spring Data JPA repository for User entity.
 */
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    /**
     * Finds a user by their username.
     *
     * @param username the username to search for
     * @return an Optional containing the user if found
     */
    Optional<User> findByUsername(String username);

    /**
     * Finds a user by username eagerly loading the full profile → actions graph.
     * <p>
     * Used during authentication to ensure action codes are available for JWT generation
     * without lazy-loading issues.
     *
     * @param username the username to search for
     * @return an Optional containing the user with profile and actions loaded
     */
    @Query("SELECT u FROM User u " +
           "LEFT JOIN FETCH u.profile p " +
           "LEFT JOIN FETCH p.profileActions pa " +
           "LEFT JOIN FETCH pa.action " +
           "WHERE u.username = :username")
    Optional<User> findByUsernameWithProfileActions(@Param("username") String username);

    /**
     * Checks whether a user with the given username exists.
     *
     * @param username the username to check
     * @return true if a user exists with the given username
     */
    boolean existsByUsername(String username);

    /**
     * Updates only the last access timestamp of a user.
     * <p>
     * A targeted update is used on purpose during login: saving the whole entity would
     * also write back the login-lock columns, overwriting the counter/lock state that
     * {@code LoginAttemptService} commits in its own transaction.
     *
     * @param username   the account username
     * @param lastAccess the new last access timestamp
     * @return the number of updated rows
     */
    @Modifying
    @Query("UPDATE User u SET u.lastAccess = :lastAccess WHERE u.username = :username")
    int updateLastAccess(@Param("username") String username, @Param("lastAccess") OffsetDateTime lastAccess);
}
