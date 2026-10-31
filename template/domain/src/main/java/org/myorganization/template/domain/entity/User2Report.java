package org.myorganization.template.domain.entity;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;

import lombok.Getter;
import lombok.Setter;

/**
 * Join table entity representing the many-to-many relationship between User and Report.
 */
@Entity
@Table(name = "user2report")
@Getter
@Setter
public class User2Report {

    @EmbeddedId
    private User2ReportPK id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("reportId")
    @JoinColumn(name = "report_id")
    private Report report;

    public User2Report() {
    }

    public User2Report(User user, Report report) {
        this.user = user;
        this.report = report;
        this.id = new User2ReportPK(user.getId(), report.getId());
    }
}
