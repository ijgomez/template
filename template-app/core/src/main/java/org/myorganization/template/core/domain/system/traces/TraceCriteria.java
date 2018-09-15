package org.myorganization.template.core.domain.system.traces;

import org.myorganization.template.core.domain.base.Criteria;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @NoArgsConstructor
public class TraceCriteria extends Criteria {

	private String message;
	
}
