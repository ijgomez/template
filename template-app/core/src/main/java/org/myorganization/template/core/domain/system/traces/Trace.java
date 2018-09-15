package org.myorganization.template.core.domain.system.traces;

import java.time.LocalDateTime;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.SequenceGenerator;

import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter @Setter @NoArgsConstructor
public class Trace {

	@Id
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "trace_seq")
	@SequenceGenerator(name = "trace_seq", sequenceName = "trace_seq", allocationSize = 1)
	private Long id;
	
	@Column(nullable = false)
	private LocalDateTime datetime;

	@Column(nullable = false)
	private String message;
	
	@Column(nullable = false)
	@Enumerated(EnumType.STRING)
	private TraceType type;
	
	public Trace(String message) {
		super();
		this.message = message;
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
