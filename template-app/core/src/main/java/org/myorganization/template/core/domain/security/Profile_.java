package org.myorganization.template.core.domain.security;

import javax.persistence.metamodel.SetAttribute;
import javax.persistence.metamodel.SingularAttribute;
import javax.persistence.metamodel.StaticMetamodel;

@StaticMetamodel(Profile.class)
public class Profile_ {

	public static volatile SingularAttribute<Profile, Integer> id;
	public static volatile SingularAttribute<Profile, String> name;
	public static volatile SingularAttribute<Profile, String> description;
	public static volatile SetAttribute<Profile, User> users;
	public static volatile SetAttribute<Profile, Action> actions;
	
}
