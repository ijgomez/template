package org.myorganization.template.domain.entity;

import java.io.Serializable;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/**
 * Composite primary key for User2Report (user_id + report_id).
 */
@Embeddable
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

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getReportId() {
        return reportId;
    }

    public void setReportId(Long reportId) {
        this.reportId = reportId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User2ReportPK that = (User2ReportPK) o;
        return Objects.equals(userId, that.userId)
                && Objects.equals(reportId, that.reportId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, reportId);
    }
}
