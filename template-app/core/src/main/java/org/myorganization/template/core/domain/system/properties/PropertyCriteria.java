package org.myorganization.template.core.domain.system.properties;

import org.myorganization.template.core.domain.base.Criteria;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper=false)
public class PropertyCriteria extends Criteria {

	private String key;
	
	private String description;
	
}
