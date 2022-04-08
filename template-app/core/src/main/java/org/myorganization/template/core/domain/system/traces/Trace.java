package org.myorganization.template.core.domain.system.traces;

import java.time.LocalDateTime;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Index;
import javax.persistence.SequenceGenerator;
import javax.persistence.Table;

import org.myorganization.template.core.domain.base.TemplateEntityBase;
import org.springframework.validation.annotation.Validated;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(indexes = {
		@Index(name = "idx_trace", columnList = "datetime, type")
	})
@Validated
@Data
@EqualsAndHashCode(callSuper=false)
public class Trace extends TemplateEntityBase {

	@Id
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "trace_seq")
	@SequenceGenerator(name = "trace_seq", sequenceName = "trace_seq", allocationSize = 1)
	private Long id;
	
	@Column(nullable = false)
	private LocalDateTime datetime;
	
	@Column(nullable = false)
	@Enumerated(EnumType.STRING)
	private TraceType type;

	@Column(nullable = false)
	private String message;

}
