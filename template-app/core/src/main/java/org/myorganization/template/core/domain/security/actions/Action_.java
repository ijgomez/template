package org.myorganization.template.core.domain.security.actions;

import javax.persistence.metamodel.SetAttribute;
import javax.persistence.metamodel.SingularAttribute;
import javax.persistence.metamodel.StaticMetamodel;

import org.myorganization.template.core.domain.security.profiles.Profile;

@StaticMetamodel(Action.class)
public class Action_ {

	public static volatile SingularAttribute<Action, Integer> id;
	public static volatile SingularAttribute<Action, String> name;
	public static volatile SingularAttribute<Action, String> description;
	public static volatile SetAttribute<Action, Profile> profiles;
	
}
