package org.myorganization.template.scheduler.events;

import org.springframework.context.ApplicationEvent;

public class TaskOrderEvent extends ApplicationEvent {

	private static final long serialVersionUID = -6672375298755655840L;
	
	private String order;

	public TaskOrderEvent(Object source, String order) {
		super(source);
		this.order = order;
	}
	
	public String getOrder() {
		return order;
	}

}
