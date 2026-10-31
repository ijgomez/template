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

import lombok.Getter;
import lombok.Setter;

/**
 * Represents a cluster task definition.
 * No timestamp audit fields (created_at/last_modified_at).
 */
@Entity
@Table(name = "cluster_task")
@Getter
@Setter
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
}
