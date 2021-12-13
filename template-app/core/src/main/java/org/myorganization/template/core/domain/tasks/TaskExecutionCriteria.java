package org.myorganization.template.core.domain.tasks;

import org.myorganization.template.core.domain.base.Criteria;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper=false)
public class TaskExecutionCriteria extends Criteria {

	private String owner;

	private TaskExecutionStatus status;

}
