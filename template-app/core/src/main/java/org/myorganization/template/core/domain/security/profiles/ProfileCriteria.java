package org.myorganization.template.core.domain.security.profiles;

import org.myorganization.template.core.domain.base.Criteria;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @NoArgsConstructor
public class ProfileCriteria extends Criteria {

	private String name;
	
	private String description;
	
}
