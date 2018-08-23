package org.myorganization.template.scheduler.services;

import org.myorganization.template.core.domain.tasks.Task;
import org.myorganization.template.core.services.tasks.TaskService;
import org.myorganization.template.tasks.DummyTask;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.core.task.TaskExecutor;
import org.springframework.stereotype.Service;

@Service
public class ExecutorService {
	
	private static Logger LOGGER = LoggerFactory.getLogger(ExecutorService.class);

	@Autowired
	private TaskService taskService;

	@Autowired
	private TaskExecutor taskExecutor;

	@Autowired
	private ApplicationContext applicationContext;

	public void execute(String taskName) {
		Task task;
		
		task = this.taskService.read(taskName);
		LOGGER.info("Execute Task: {}", task.getName());
		this.taskExecutor.execute(applicationContext.getBean(DummyTask.class, task));
		
	}
	
	public void cancel(String taskName) {
		Task task;
		
		task = this.taskService.read(taskName);
		LOGGER.info("Cancel Task: {}", task.getName());

	}
	
	public void scheduler(String taskName) {
		
	}
}
