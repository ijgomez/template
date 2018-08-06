package org.myorganization.template.core.domain.system.traces;

import javax.persistence.metamodel.SingularAttribute;
import javax.persistence.metamodel.StaticMetamodel;

@StaticMetamodel(Trace.class)
public class Trace_ {

	public static volatile SingularAttribute<Trace, Integer> id;
	public static volatile SingularAttribute<Trace, String> message;
	
}
