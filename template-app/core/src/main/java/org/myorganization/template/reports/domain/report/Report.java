package org.myorganization.template.reports.domain.report;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.ForeignKey;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.OneToOne;
import javax.persistence.SequenceGenerator;
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;

import org.myorganization.template.core.domain.archives.Archive;
import org.myorganization.template.core.domain.base.TemplateEntityBase;
import org.myorganization.template.reports.domain.reportengine.ReportEngine;
import org.springframework.validation.annotation.Validated;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(uniqueConstraints={@UniqueConstraint(name = "uk_report_name", columnNames={"name"})})
@Validated
@Data
@EqualsAndHashCode(callSuper=false)
public class Report extends TemplateEntityBase {

	@Id
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "report_seq")
	@SequenceGenerator(name = "report_seq", sequenceName = "report_seq", allocationSize = 1)
	private Long id;

	@Column(nullable = false)
	private String name;
	
	@ManyToOne(optional = false)
	@JoinColumn(name="engine_fk", foreignKey = @ForeignKey(name="fk_report_engine"))
	private ReportEngine engine;
	
	@Column(nullable = false)
	private String description;
	
	@OneToOne
    @JoinColumn(name = "archive_fk", foreignKey = @ForeignKey(name="fk_report_archive"))
	@JsonManagedReference
	@JsonProperty("descriptor")
	private Archive archive;

}
