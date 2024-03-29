package org.myorganization.template.security.domain.profiles;

import org.myorganization.template.core.domain.base.Criteria;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper=false)
public class ProfileCriteria extends Criteria {

	private String name;
	
	private String description;
	
}
