package org.myorganization.template.core.domain.tasks;

import java.time.Duration;
import java.time.LocalDateTime;

import javax.persistence.metamodel.SingularAttribute;
import javax.persistence.metamodel.StaticMetamodel;

@StaticMetamodel(TaskExecution.class)
public class TaskExecution_ {

	public static volatile SingularAttribute<TaskExecution, Long> id;
	public static volatile SingularAttribute<TaskExecution, Task> task;
	public static volatile SingularAttribute<TaskExecution, LocalDateTime> dispatchedAt;
	public static volatile SingularAttribute<TaskExecution, Duration> duration;
	public static volatile SingularAttribute<TaskExecution, String> owner;
	public static volatile SingularAttribute<TaskExecution, String> status;
	
}
