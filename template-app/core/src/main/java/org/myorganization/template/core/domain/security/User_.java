package org.myorganization.template.core.domain.security;

import javax.persistence.metamodel.SingularAttribute;
import javax.persistence.metamodel.StaticMetamodel;

@StaticMetamodel(User.class)
public class User_ {

	public static volatile SingularAttribute<User, Integer> id;
	public static volatile SingularAttribute<User, String> username;
	public static volatile SingularAttribute<User, String> password;
	
}
