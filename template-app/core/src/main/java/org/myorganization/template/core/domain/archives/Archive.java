package org.myorganization.template.core.domain.archives;

import javax.persistence.Basic;
import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.Lob;
import javax.persistence.OneToOne;
import javax.persistence.SequenceGenerator;

import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.myorganization.template.core.domain.reports.Report;

@Entity
public class Archive {

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
	
	@OneToOne
    @JoinColumn(name = "report_id")
	private Report report;
	
	public Archive() {
		super();
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getFilename() {
		return filename;
	}

	public void setFilename(String filename) {
		this.filename = filename;
	}

	public String getFiletype() {
		return filetype;
	}

	public void setFiletype(String filetype) {
		this.filetype = filetype;
	}

	public String getValue() {
		return value;
	}

	public void setValue(String value) {
		this.value = value;
	}

	public Long getSize() {
		return size;
	}

	public void setSize(Long size) {
		this.size = size;
	}
	
	public Report getReport() {
		return report;
	}

	public void setReport(Report report) {
		this.report = report;
	}

	@Override
	public int hashCode() {
		return HashCodeBuilder.reflectionHashCode(this, true);
	}

	@Override
	public boolean equals(Object obj) {
		return EqualsBuilder.reflectionEquals(this, obj, true);
	}

	@Override
	public String toString() {
		return ToStringBuilder.reflectionToString(this);
	}
}
