package org.myorganization.template.domain.dto;

import java.time.OffsetDateTime;

import org.myorganization.template.domain.enums.NodeStatus;

/**
 * Data Transfer Object for ClusterNode entity.
 *
 * @param id              cluster node identifier
 * @param status          node status
 * @param hostname        node hostname
 * @param ip              node IP address
 * @param master          whether this node is the master
 * @param usedMemory      used memory in bytes
 * @param freeMemory      free memory in bytes
 * @param totalMemory     total memory in bytes
 * @param startedAt       node start timestamp
 * @param lastModifiedAt  last modification timestamp
 */
public record ClusterNodeDTO(
        Long id,
        NodeStatus status,
        String hostname,
        String ip,
        Boolean master,
        Long usedMemory,
        Long freeMemory,
        Long totalMemory,
        OffsetDateTime startedAt,
        OffsetDateTime lastModifiedAt
) {
}
