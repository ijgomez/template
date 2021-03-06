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
import org.myorganization.template.core.domain.reports.Report;

import com.fasterxml.jackson.annotation.JsonBackReference;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter @Setter @NoArgsConstructor
public class Archive extends TemplateEntity {

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
