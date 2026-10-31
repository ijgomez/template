package org.myorganization.template.domain.entity;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

import lombok.Getter;
import lombok.Setter;

/**
 * Represents a report that can be assigned to users for execution and export.
 */
@Entity
@Table(name = "report")
@Getter
@Setter
public class Report extends BaseEntity {

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description")
    private String description;

    @OneToMany(mappedBy = "report")
    private List<User2Report> userReports = new ArrayList<>();
}
