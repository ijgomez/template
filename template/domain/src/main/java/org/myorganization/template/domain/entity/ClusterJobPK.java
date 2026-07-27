package org.myorganization.template.domain.entity;

import java.io.Serializable;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/**
 * Composite primary key for ClusterJob (cluster_node_id + cluster_task_id).
 */
@Embeddable
public class ClusterJobPK implements Serializable {

    private static final long serialVersionUID = 1L;

    @Column(name = "cluster_node_id")
    private Long clusterNodeId;

    @Column(name = "cluster_task_id")
    private Long clusterTaskId;

    public ClusterJobPK() {
    }

    public ClusterJobPK(Long clusterNodeId, Long clusterTaskId) {
        this.clusterNodeId = clusterNodeId;
        this.clusterTaskId = clusterTaskId;
    }

    public Long getClusterNodeId() {
        return clusterNodeId;
    }

    public void setClusterNodeId(Long clusterNodeId) {
        this.clusterNodeId = clusterNodeId;
    }

    public Long getClusterTaskId() {
        return clusterTaskId;
    }

    public void setClusterTaskId(Long clusterTaskId) {
        this.clusterTaskId = clusterTaskId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ClusterJobPK that = (ClusterJobPK) o;
        return Objects.equals(clusterNodeId, that.clusterNodeId)
                && Objects.equals(clusterTaskId, that.clusterTaskId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(clusterNodeId, clusterTaskId);
    }
}
