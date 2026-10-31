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
 * Represents a security profile that groups actions.
 */
@Entity
@Table(name = "profile")
@Getter
@Setter
public class Profile extends BaseEntity {

    @Column(name = "name", nullable = false, unique = true)
    private String name;

    @Column(name = "description")
    private String description;

    @OneToMany(mappedBy = "profile")
    private List<Profile2Action> profileActions = new ArrayList<>();

    @OneToMany(mappedBy = "profile")
    private List<User> users = new ArrayList<>();
}
