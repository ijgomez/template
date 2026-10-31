package org.myorganization.template.domain.entity;

import org.myorganization.template.domain.enums.InterfaceStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

import lombok.Getter;
import lombok.Setter;

/**
 * Represents an external interface (API endpoint) monitored by the system.
 */
@Entity
@Table(name = "interface")
@Getter
@Setter
public class Interface extends BaseEntity {

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description")
    private String description;

    @Column(name = "url")
    private String url;

    @Column(name = "protocol")
    private String protocol;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private InterfaceStatus status;

    @Column(name = "check_frequency")
    private Integer checkFrequency;
}
