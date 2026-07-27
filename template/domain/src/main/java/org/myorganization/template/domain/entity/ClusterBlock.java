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

/**
 * Represents a cluster block (lock record) with execution metrics.
 * No timestamp audit fields (created_at/last_modified_at).
 */
@Entity
@Table(name = "cluster_block")
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

    public OffsetDateTime getStartDate() {
        return startDate;
    }

    public void setStartDate(OffsetDateTime startDate) {
        this.startDate = startDate;
    }

    public Long getAvgTime() {
        return avgTime;
    }

    public void setAvgTime(Long avgTime) {
        this.avgTime = avgTime;
    }

    public Long getMinTime() {
        return minTime;
    }

    public void setMinTime(Long minTime) {
        this.minTime = minTime;
    }

    public Long getMaxTime() {
        return maxTime;
    }

    public void setMaxTime(Long maxTime) {
        this.maxTime = maxTime;
    }

    public Long getTotal() {
        return total;
    }

    public void setTotal(Long total) {
        this.total = total;
    }

    public ClusterTask getClusterTask() {
        return clusterTask;
    }

    public void setClusterTask(ClusterTask clusterTask) {
        this.clusterTask = clusterTask;
    }
}
