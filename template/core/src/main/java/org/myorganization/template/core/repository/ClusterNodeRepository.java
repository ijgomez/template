package org.myorganization.template.core.repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import org.myorganization.template.domain.entity.ClusterNode;
import org.myorganization.template.domain.enums.NodeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for ClusterNode entity.
 */
@Repository
public interface ClusterNodeRepository extends JpaRepository<ClusterNode, Long> {

    Optional<ClusterNode> findByHostname(String hostname);

    List<ClusterNode> findByStatus(NodeStatus status);

    List<ClusterNode> findByStatusAndLastModifiedAtBefore(NodeStatus status, OffsetDateTime threshold);

    Optional<ClusterNode> findByMasterTrueAndStatus(NodeStatus status);

    @Modifying
    @Query("UPDATE ClusterNode n SET n.master = false WHERE n.master = true")
    void deactivateAllMasters();

    Optional<ClusterNode> findFirstByStatusOrderByIdAsc(NodeStatus status);
}
