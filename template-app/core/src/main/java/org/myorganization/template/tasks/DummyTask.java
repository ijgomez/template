package org.myorganization.template.tasks;

import org.myorganization.template.scheduler.annotations.TemplateTaskAnnotation;
import org.myorganization.template.scheduler.domain.tasks.Task;
import org.myorganization.template.tasks.base.TaskBase;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

@TemplateTaskAnnotation
@Component
@Scope("prototype")
public class DummyTask extends TaskBase implements Runnable {

	public DummyTask(Task task) {

		super(task);
		// TODO Auto-generated constructor stub
	}
	
	@Override
	protected void handlerRun() throws Exception {

		// TODO Auto-generated method stub
		Thread.sleep(60000);

	}
	
	

}
