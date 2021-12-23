package org.myorganization.template.security.domain.users;

import org.myorganization.template.core.domain.base.Criteria;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper=false)
public class UserCriteria extends Criteria {

	private String username;
	
}
