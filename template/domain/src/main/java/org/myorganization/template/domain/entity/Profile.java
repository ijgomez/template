package org.myorganization.template.domain.entity;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

/**
 * Represents a security profile that groups actions.
 */
@Entity
@Table(name = "profile")
public class Profile extends BaseEntity {

    @Column(name = "name", nullable = false, unique = true)
    private String name;

    @Column(name = "description")
    private String description;

    @OneToMany(mappedBy = "profile")
    private List<Profile2Action> profileActions = new ArrayList<>();

    @OneToMany(mappedBy = "profile")
    private List<User> users = new ArrayList<>();

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

    public List<Profile2Action> getProfileActions() {
        return profileActions;
    }

    public void setProfileActions(List<Profile2Action> profileActions) {
        this.profileActions = profileActions;
    }

    public List<User> getUsers() {
        return users;
    }

    public void setUsers(List<User> users) {
        this.users = users;
    }
}
