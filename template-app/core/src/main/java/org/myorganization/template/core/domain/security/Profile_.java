package org.myorganization.template.core.domain.security;

import javax.persistence.metamodel.SingularAttribute;
import javax.persistence.metamodel.StaticMetamodel;

@StaticMetamodel(Profile.class)
public class Profile_ {

	public static volatile SingularAttribute<Profile, Integer> id;
	public static volatile SingularAttribute<Profile, String> name;
	public static volatile SingularAttribute<Profile, String> description;
	
}
