package org.myorganization.template.core.domain.system.properties;

import javax.persistence.metamodel.SingularAttribute;
import javax.persistence.metamodel.StaticMetamodel;

@StaticMetamodel(Property.class)
public class Property_ {

	public static volatile SingularAttribute<Property, Integer> id;
	public static volatile SingularAttribute<Property, String> property;
	public static volatile SingularAttribute<Property, String> value;
	
}
