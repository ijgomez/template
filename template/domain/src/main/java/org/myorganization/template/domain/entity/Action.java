package org.myorganization.template.domain.entity;

import java.util.ArrayList;
import java.util.List;

import org.myorganization.template.domain.enums.ActionType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

/**
 * Represents a security action (permission) that can be assigned to profiles.
 */
@Entity
@Table(name = "action")
public class Action extends BaseEntity {

    @Column(name = "code", nullable = false, unique = true)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private ActionType type;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description")
    private String description;

    @OneToMany(mappedBy = "action")
    private List<Profile2Action> profileActions = new ArrayList<>();

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public ActionType getType() {
        return type;
    }

    public void setType(ActionType type) {
        this.type = type;
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

    public List<Profile2Action> getProfileActions() {
        return profileActions;
    }

    public void setProfileActions(List<Profile2Action> profileActions) {
        this.profileActions = profileActions;
    }
}
