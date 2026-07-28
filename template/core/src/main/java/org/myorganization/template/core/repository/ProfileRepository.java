package org.myorganization.template.core.repository;

import java.util.Optional;

import org.myorganization.template.domain.entity.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for Profile entity.
 * Supports Specification-based queries for criteria filtering.
 */
@Repository
public interface ProfileRepository extends JpaRepository<Profile, Long>, JpaSpecificationExecutor<Profile> {

    /**
     * Finds a profile by its unique name.
     *
     * @param name the profile name
     * @return an Optional containing the profile if found
     */
    Optional<Profile> findByName(String name);

    /**
     * Checks whether a profile with the given name already exists.
     *
     * @param name the profile name
     * @return true if a profile with that name exists
     */
    boolean existsByName(String name);
}
