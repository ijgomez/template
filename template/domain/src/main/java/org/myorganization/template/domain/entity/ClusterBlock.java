package org.myorganization.template.domain.entity;

import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import lombok.Getter;
import lombok.Setter;

/**
 * Represents a cluster block (lock record) with execution metrics.
 * No timestamp audit fields (created_at/last_modified_at).
 */
@Entity
@Table(name = "cluster_block")
@Getter
@Setter
public class ClusterBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    @Column(name = "id")
    private Long id;

    @Column(name = "name", nullable = false, unique = true)
    private String name;

    @Column(name = "start_date")
    private OffsetDateTime startDate;

    @Column(name = "avg_time")
    private Long avgTime;

    @Column(name = "min_time")
    private Long minTime;

    @Column(name = "max_time")
    private Long maxTime;

    @Column(name = "total")
    private Long total;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "name", referencedColumnName = "name", insertable = false, updatable = false)
    private ClusterTask clusterTask;
}
