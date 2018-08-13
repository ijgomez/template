package org.myorganization.template.core.domain.security;

import javax.persistence.metamodel.SingularAttribute;
import javax.persistence.metamodel.StaticMetamodel;

@StaticMetamodel(Action.class)
public class Action_ {

	public static volatile SingularAttribute<Action, Integer> id;
	public static volatile SingularAttribute<Action, String> name;
	public static volatile SingularAttribute<Action, String> description;
	
}
