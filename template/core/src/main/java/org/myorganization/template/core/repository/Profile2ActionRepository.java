package org.myorganization.template.core.repository;

import java.util.List;

import org.myorganization.template.domain.entity.Profile2Action;
import org.myorganization.template.domain.entity.Profile2ActionPK;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for Profile2Action join entity.
 */
@Repository
public interface Profile2ActionRepository extends JpaRepository<Profile2Action, Profile2ActionPK> {

    /**
     * Finds all profile-action associations for a given profile ID.
     *
     * @param profileId the profile identifier
     * @return list of Profile2Action entries
     */
    List<Profile2Action> findByIdProfileId(Long profileId);

    /**
     * Deletes all profile-action associations for a given profile ID.
     *
     * @param profileId the profile identifier
     */
    void deleteByIdProfileId(Long profileId);
}
