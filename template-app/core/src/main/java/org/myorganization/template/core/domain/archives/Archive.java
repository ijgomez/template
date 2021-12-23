package org.myorganization.template.core.domain.archives;

import javax.persistence.Basic;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Lob;
import javax.persistence.OneToOne;
import javax.persistence.SequenceGenerator;

import org.myorganization.template.core.domain.base.TemplateEntity;
import org.myorganization.template.core.domain.base.TemplateEntityBase;
import org.myorganization.template.reports.domain.Report;
import org.springframework.validation.annotation.Validated;

import com.fasterxml.jackson.annotation.JsonBackReference;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Validated
@Data
@EqualsAndHashCode(callSuper=false)
public class Archive extends TemplateEntityBase implements TemplateEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "archive_seq")
	@SequenceGenerator(name = "archive_seq", sequenceName = "archive_seq", allocationSize = 1)
	private Long id;

	@Column(nullable = false)
	private String filename;

	@Column(nullable = false)
	private String filetype;
	
	@Lob
	@Column(nullable = false)
	@Basic(fetch = FetchType.LAZY, optional = false)
	private String value;

	@Column(nullable = false)
	private Long size;
	
	@OneToOne(mappedBy = "archive")
	@JsonBackReference
	private Report report;

}
