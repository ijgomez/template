package org.myorganization.template.reports.domain.reportengine;

import java.util.Set;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.OneToMany;
import javax.persistence.SequenceGenerator;

import org.myorganization.template.core.domain.base.TemplateEntity;
import org.myorganization.template.core.domain.base.TemplateEntityBase;
import org.myorganization.template.reports.domain.report.Report;
import org.springframework.validation.annotation.Validated;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Validated
@Data
@EqualsAndHashCode(callSuper=false)
public class ReportEngine extends TemplateEntityBase implements TemplateEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "report_engine_seq")
	@SequenceGenerator(name = "report_engine_seq", sequenceName = "report_engine_seq", allocationSize = 1)
	private Long id;
	
	@Column(nullable = false)
	private String type;
	
	@Column(nullable = false)
	private String description;
	
	@OneToMany(mappedBy="engine")
	@JsonIgnore
	private Set<Report> reports;
	
}
