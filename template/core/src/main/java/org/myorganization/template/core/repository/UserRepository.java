package org.myorganization.template.core.repository;

import java.util.Optional;

import org.myorganization.template.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for User entity.
 */
@Repository
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
}
