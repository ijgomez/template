package org.myorganization.template.core.domain.tasks;

import javax.persistence.metamodel.SetAttribute;
import javax.persistence.metamodel.SingularAttribute;
import javax.persistence.metamodel.StaticMetamodel;

@StaticMetamodel(Task.class)
@SuppressWarnings({"squid:S1118", "squid:S101", "squid:S3077", "squid:S1104", "squid:S1444"})
public class Task_ {

	public static volatile SingularAttribute<Task, Integer> id;
	public static volatile SingularAttribute<Task, String> name;
	public static volatile SingularAttribute<Task, String> description;
	public static volatile SetAttribute<Task, TaskExecution> executions;
	
}
