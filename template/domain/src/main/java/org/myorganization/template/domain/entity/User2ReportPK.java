package org.myorganization.template.domain.entity;

import java.io.Serializable;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

/**
 * Composite primary key for User2Report (user_id + report_id).
 */
@Embeddable
@Getter
@Setter
@EqualsAndHashCode
public class User2ReportPK implements Serializable {

    private static final long serialVersionUID = 1L;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "report_id")
    private Long reportId;

    public User2ReportPK() {
    }

    public User2ReportPK(Long userId, Long reportId) {
        this.userId = userId;
        this.reportId = reportId;
    }
}
