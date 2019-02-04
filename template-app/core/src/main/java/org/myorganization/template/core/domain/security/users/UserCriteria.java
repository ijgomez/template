package org.myorganization.template.core.domain.security.users;

import org.myorganization.template.core.domain.base.Criteria;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @NoArgsConstructor
public class UserCriteria extends Criteria {

	private String username;
	
}
