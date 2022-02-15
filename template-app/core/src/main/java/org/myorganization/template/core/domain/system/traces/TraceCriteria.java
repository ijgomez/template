package org.myorganization.template.core.domain.system.traces;

import java.time.LocalDateTime;

import org.myorganization.template.core.domain.base.Criteria;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper=false)
public class TraceCriteria extends Criteria {

	private String message;
	
	private TraceType type;
	
	private LocalDateTime fromDate;
	
	private LocalDateTime toDate;
	
}
