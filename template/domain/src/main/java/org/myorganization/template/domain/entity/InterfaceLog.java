package org.myorganization.template.domain.entity;

import java.time.OffsetDateTime;

import org.myorganization.template.domain.enums.InterfaceLogStatus;
import org.myorganization.template.domain.enums.InterfaceOperationType;

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
 * Represents an immutable interface operation log entry. Append-only — no updates or deletes.
 */
@Entity
@Table(name = "interface_log")
public class InterfaceLog {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    @Column(name = "id")
    private Long id;

    @Column(name = "timestamp", nullable = false, updatable = false)
    private OffsetDateTime timestamp;

    @Enumerated(EnumType.STRING)
    @Column(name = "operation_type", nullable = false, updatable = false)
    private InterfaceOperationType operationType;

    @Column(name = "interface_name", nullable = false, updatable = false)
    private String interfaceName;

    @Column(name = "request_payload", columnDefinition = "text", updatable = false)
    private String requestPayload;

    @Column(name = "response_payload", columnDefinition = "text", updatable = false)
    private String responsePayload;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, updatable = false)
    private InterfaceLogStatus status;

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

    public InterfaceOperationType getOperationType() {
        return operationType;
    }

    public void setOperationType(InterfaceOperationType operationType) {
        this.operationType = operationType;
    }

    public String getInterfaceName() {
        return interfaceName;
    }

    public void setInterfaceName(String interfaceName) {
        this.interfaceName = interfaceName;
    }

    public String getRequestPayload() {
        return requestPayload;
    }

    public void setRequestPayload(String requestPayload) {
        this.requestPayload = requestPayload;
    }

    public String getResponsePayload() {
        return responsePayload;
    }

    public void setResponsePayload(String responsePayload) {
        this.responsePayload = responsePayload;
    }

    public InterfaceLogStatus getStatus() {
        return status;
    }

    public void setStatus(InterfaceLogStatus status) {
        this.status = status;
    }
}
