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

import lombok.Getter;
import lombok.Setter;

/**
 * Represents a security action (permission) that can be assigned to profiles.
 */
@Entity
@Table(name = "action")
@Getter
@Setter
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
}
