package org.myorganization.template.tasks;

import org.myorganization.template.scheduler.domain.tasks.Task;
import org.myorganization.template.tasks.base.TaskBase;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

@Component
@Scope("prototype")
public class PuppetTask extends TaskBase implements Runnable {

	public PuppetTask(Task task) {
		super(task);
		// TODO Auto-generated constructor stub
	}
	
	@Override
	protected void handlerRun() throws Exception {
		// TODO Auto-generated method stub
		Thread.sleep(60000);
	}

}
