package org.myorganization.template.scheduler.domain.tasks;

import org.myorganization.template.core.domain.base.Criteria;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper=false)
public class TaskCriteria extends Criteria {

	private String name;
	
	private String description;

}
