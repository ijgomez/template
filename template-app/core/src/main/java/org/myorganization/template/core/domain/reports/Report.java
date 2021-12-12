package org.myorganization.template.core.domain.reports;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.OneToOne;
import javax.persistence.SequenceGenerator;

import org.myorganization.template.core.domain.archives.Archive;
import org.myorganization.template.core.domain.base.TemplateEntity;
import org.myorganization.template.core.domain.base.TemplateEntityBase;
import org.springframework.validation.annotation.Validated;

import com.fasterxml.jackson.annotation.JsonManagedReference;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Validated
@Data
@EqualsAndHashCode(callSuper=false)
public class Report extends TemplateEntityBase implements TemplateEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "report_seq")
	@SequenceGenerator(name = "report_seq", sequenceName = "report_seq", allocationSize = 1)
	private Long id;

	@Column(nullable = false)
	private String name;
	
	@Column(nullable = false)
	private String description;
	
	@OneToOne
    @JoinColumn(name = "archive_id")
	@JsonManagedReference
	private Archive archive;

}
