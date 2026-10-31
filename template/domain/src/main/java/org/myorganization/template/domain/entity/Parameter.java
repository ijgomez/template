package org.myorganization.template.domain.entity;

import org.myorganization.template.domain.enums.ParameterType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

import lombok.Getter;
import lombok.Setter;

/**
 * Represents a configurable system parameter with typed values.
 */
@Entity
@Table(name = "parameter")
@Getter
@Setter
public class Parameter extends BaseEntity {

    @Column(name = "code", nullable = false, unique = true)
    private String code;

    @Column(name = "description")
    private String description;

    @Column(name = "parameter_value")
    private String value;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private ParameterType type;
}
