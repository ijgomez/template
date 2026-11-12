package org.myorganization.template.domain.entity;

import java.io.Serializable;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

/**
 * Composite primary key for ClusterJob (cluster_node_fk + cluster_task_fk).
 */
@Embeddable
@Getter
@Setter
@EqualsAndHashCode
public class ClusterJobPK implements Serializable {

    private static final long serialVersionUID = 1L;

    @Column(name = "cluster_node_fk")
    private Long clusterNodeId;

    @Column(name = "cluster_task_fk")
    private Long clusterTaskId;

    public ClusterJobPK() {
    }

    public ClusterJobPK(Long clusterNodeId, Long clusterTaskId) {
        this.clusterNodeId = clusterNodeId;
        this.clusterTaskId = clusterTaskId;
    }
}
