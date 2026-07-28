package org.myorganization.template.core.repository;

import java.util.List;

import org.myorganization.template.domain.entity.User2Report;
import org.myorganization.template.domain.entity.User2ReportPK;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for User2Report join table entity.
 */
@Repository
public interface User2ReportRepository extends JpaRepository<User2Report, User2ReportPK> {

    /**
     * Finds all user-report associations for a given user.
     *
     * @param userId the user identifier
     * @return list of user-report associations
     */
    List<User2Report> findByIdUserId(Long userId);

    /**
     * Deletes all user-report associations for a given user.
     *
     * @param userId the user identifier
     */
    void deleteByIdUserId(Long userId);
}
