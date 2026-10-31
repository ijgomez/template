package org.myorganization.template.domain.entity;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import org.myorganization.template.domain.enums.NodeStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;

import lombok.Getter;
import lombok.Setter;

/**
 * Represents a node in the application cluster.
 * Has started_at and last_modified_at but no created_at.
 * All timestamps are stored in UTC.
 */
@Entity
@Table(name = "cluster_node")
@Getter
@Setter
public class ClusterNode {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "cluster_node_gen")
    @SequenceGenerator(name = "cluster_node_gen", sequenceName = "cluster_node_seq", allocationSize = 50)
    @Column(name = "id")
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private NodeStatus status;

    @Column(name = "hostname", nullable = false)
    private String hostname;

    @Column(name = "ip")
    private String ip;

    @Column(name = "master", nullable = false)
    private Boolean master;

    @Column(name = "used_memory")
    private Long usedMemory;

    @Column(name = "free_memory")
    private Long freeMemory;

    @Column(name = "total_memory")
    private Long totalMemory;

    @Column(name = "started_at")
    private OffsetDateTime startedAt;

    @Column(name = "last_modified_at", nullable = false)
    private OffsetDateTime lastModifiedAt;

    @PrePersist
    protected void onCreate() {
        this.lastModifiedAt = OffsetDateTime.now(ZoneOffset.UTC);
    }

    /**
     * Convenience method for boolean checks (e.g. stream filters).
     *
     * @return true if this node is the current master
     */
    public boolean isMaster() {
        return Boolean.TRUE.equals(master);
    }
}
