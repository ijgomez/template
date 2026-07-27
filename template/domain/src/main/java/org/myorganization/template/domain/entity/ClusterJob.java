package org.myorganization.template.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;

/**
 * Represents the assignment of a cluster task to a cluster node with priority and enabled status.
 * Uses a composite primary key (cluster_node_id + cluster_task_id).
 */
@Entity
@Table(name = "cluster_job")
public class ClusterJob {

    @EmbeddedId
    private ClusterJobPK id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("clusterNodeId")
    @JoinColumn(name = "cluster_node_id")
    private ClusterNode clusterNode;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("clusterTaskId")
    @JoinColumn(name = "cluster_task_id")
    private ClusterTask clusterTask;

    @Column(name = "priority")
    private Integer priority;

    @Column(name = "enabled", nullable = false)
    private Boolean enabled;

    public ClusterJobPK getId() {
        return id;
    }

    public void setId(ClusterJobPK id) {
        this.id = id;
    }

    public ClusterNode getClusterNode() {
        return clusterNode;
    }

    public void setClusterNode(ClusterNode clusterNode) {
        this.clusterNode = clusterNode;
    }

    public ClusterTask getClusterTask() {
        return clusterTask;
    }

    public void setClusterTask(ClusterTask clusterTask) {
        this.clusterTask = clusterTask;
    }

    public Integer getPriority() {
        return priority;
    }

    public void setPriority(Integer priority) {
        this.priority = priority;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }
}
