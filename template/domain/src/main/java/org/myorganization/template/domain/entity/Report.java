package org.myorganization.template.domain.entity;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

/**
 * Represents a report that can be assigned to users for execution and export.
 */
@Entity
@Table(name = "report")
public class Report extends BaseEntity {

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description")
    private String description;

    @OneToMany(mappedBy = "report")
    private List<User2Report> userReports = new ArrayList<>();

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

    public List<User2Report> getUserReports() {
        return userReports;
    }

    public void setUserReports(List<User2Report> userReports) {
        this.userReports = userReports;
    }
}
