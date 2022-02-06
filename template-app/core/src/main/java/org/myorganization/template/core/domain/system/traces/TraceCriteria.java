package org.myorganization.template.core.domain.system.traces;

import org.myorganization.template.core.domain.base.Criteria;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper=false)
public class TraceCriteria extends Criteria {

	private String message;
	
	private TraceType type;
	
}
