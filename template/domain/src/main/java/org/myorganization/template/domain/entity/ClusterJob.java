package org.myorganization.template.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;

import lombok.Getter;
import lombok.Setter;

/**
 * Represents the assignment of a cluster task to a cluster node with priority and enabled status.
 * Uses a composite primary key (cluster_node_id + cluster_task_id).
 */
@Entity
@Table(name = "cluster_job")
@Getter
@Setter
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
}
