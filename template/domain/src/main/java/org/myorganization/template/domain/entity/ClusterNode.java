package org.myorganization.template.domain.entity;

import java.time.OffsetDateTime;

import org.myorganization.template.domain.enums.NodeStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

/**
 * Represents a node in the application cluster.
 * Has started_at and last_modified_at but no created_at.
 */
@Entity
@Table(name = "cluster_node")
public class ClusterNode {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
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
        this.lastModifiedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.lastModifiedAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public NodeStatus getStatus() {
        return status;
    }

    public void setStatus(NodeStatus status) {
        this.status = status;
    }

    public String getHostname() {
        return hostname;
    }

    public void setHostname(String hostname) {
        this.hostname = hostname;
    }

    public String getIp() {
        return ip;
    }

    public void setIp(String ip) {
        this.ip = ip;
    }

    public Boolean getMaster() {
        return master;
    }

    public void setMaster(Boolean master) {
        this.master = master;
    }

    public Long getUsedMemory() {
        return usedMemory;
    }

    public void setUsedMemory(Long usedMemory) {
        this.usedMemory = usedMemory;
    }

    public Long getFreeMemory() {
        return freeMemory;
    }

    public void setFreeMemory(Long freeMemory) {
        this.freeMemory = freeMemory;
    }

    public Long getTotalMemory() {
        return totalMemory;
    }

    public void setTotalMemory(Long totalMemory) {
        this.totalMemory = totalMemory;
    }

    public OffsetDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(OffsetDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public OffsetDateTime getLastModifiedAt() {
        return lastModifiedAt;
    }

    public void setLastModifiedAt(OffsetDateTime lastModifiedAt) {
        this.lastModifiedAt = lastModifiedAt;
    }
}
