package org.myorganization.template.domain.entity;

import java.time.OffsetDateTime;

import org.myorganization.template.domain.enums.AuditSection;
import org.myorganization.template.domain.enums.OperationType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

/**
 * Represents an immutable audit log entry. Append-only — no updates or deletes.
 */
@Entity
@Table(name = "audit_log")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    @Column(name = "id")
    private Long id;

    @Column(name = "timestamp", nullable = false, updatable = false)
    private OffsetDateTime timestamp;

    @Column(name = "username", nullable = false, updatable = false)
    private String username;

    @Enumerated(EnumType.STRING)
    @Column(name = "operation_type", nullable = false, updatable = false)
    private OperationType operationType;

    @Enumerated(EnumType.STRING)
    @Column(name = "section", nullable = false, updatable = false)
    private AuditSection section;

    @Column(name = "entity_id", updatable = false)
    private String entityId;

    @Column(name = "entity_name", updatable = false)
    private String entityName;

    @Column(name = "detail", columnDefinition = "text", updatable = false)
    private String detail;

    @PrePersist
    protected void onCreate() {
        if (this.timestamp == null) {
            this.timestamp = OffsetDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public OffsetDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(OffsetDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public OperationType getOperationType() {
        return operationType;
    }

    public void setOperationType(OperationType operationType) {
        this.operationType = operationType;
    }

    public AuditSection getSection() {
        return section;
    }

    public void setSection(AuditSection section) {
        this.section = section;
    }

    public String getEntityId() {
        return entityId;
    }

    public void setEntityId(String entityId) {
        this.entityId = entityId;
    }

    public String getEntityName() {
        return entityName;
    }

    public void setEntityName(String entityName) {
        this.entityName = entityName;
    }

    public String getDetail() {
        return detail;
    }

    public void setDetail(String detail) {
        this.detail = detail;
    }
}
