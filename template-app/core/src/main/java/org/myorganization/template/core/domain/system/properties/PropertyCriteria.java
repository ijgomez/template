package org.myorganization.template.core.domain.system.properties;

import org.myorganization.template.core.domain.base.Criteria;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @NoArgsConstructor
public class PropertyCriteria extends Criteria {

	private String property;
	
}
