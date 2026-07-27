package org.myorganization.template.domain.entity;

import org.myorganization.template.domain.enums.InterfaceStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

/**
 * Represents an external interface (API endpoint) monitored by the system.
 */
@Entity
@Table(name = "interface")
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

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getProtocol() {
        return protocol;
    }

    public void setProtocol(String protocol) {
        this.protocol = protocol;
    }

    public InterfaceStatus getStatus() {
        return status;
    }

    public void setStatus(InterfaceStatus status) {
        this.status = status;
    }

    public Integer getCheckFrequency() {
        return checkFrequency;
    }

    public void setCheckFrequency(Integer checkFrequency) {
        this.checkFrequency = checkFrequency;
    }
}
