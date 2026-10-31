package org.myorganization.template.domain.entity;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

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

import lombok.Getter;
import lombok.Setter;

/**
 * Represents an immutable audit log entry. Append-only — no updates or deletes.
 */
@Entity
@Table(name = "audit_log")
@Getter
@Setter
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
            this.timestamp = OffsetDateTime.now(ZoneOffset.UTC);
        }
    }
}
