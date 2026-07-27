package org.myorganization.template.domain.entity;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

/**
 * Represents a cluster task definition.
 * No timestamp audit fields (created_at/last_modified_at).
 */
@Entity
@Table(name = "cluster_task")
public class ClusterTask {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    @Column(name = "id")
    private Long id;

    @Column(name = "name", nullable = false, unique = true)
    private String name;

    @Column(name = "description")
    private String description;

    @Column(name = "nodes")
    private Integer nodes;

    @Column(name = "min_nodes")
    private Integer minNodes;

    @OneToMany(mappedBy = "clusterTask")
    private List<ClusterJob> clusterJobs = new ArrayList<>();

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getNodes() {
        return nodes;
    }

    public void setNodes(Integer nodes) {
        this.nodes = nodes;
    }

    public Integer getMinNodes() {
        return minNodes;
    }

    public void setMinNodes(Integer minNodes) {
        this.minNodes = minNodes;
    }

    public List<ClusterJob> getClusterJobs() {
        return clusterJobs;
    }

    public void setClusterJobs(List<ClusterJob> clusterJobs) {
        this.clusterJobs = clusterJobs;
    }
}
