package org.myorganization.template.core.domain.security.actions;

import org.myorganization.template.core.domain.base.Criteria;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper=false)
public class ActionCriteria extends Criteria {

	private String name;
	
	private String description;

}
