package org.myorganization.template.core.domain.reports;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.OneToOne;
import javax.persistence.SequenceGenerator;

import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.myorganization.template.core.domain.archives.Archive;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter @Setter @NoArgsConstructor
public class Report {

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
	private Archive archive;
	
	public Report(String name) {
		super();
		this.name = name;
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
