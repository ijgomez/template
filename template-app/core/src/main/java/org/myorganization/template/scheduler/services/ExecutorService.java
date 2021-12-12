package org.myorganization.template.scheduler.services;

import org.myorganization.template.core.services.tasks.TaskService;
import org.myorganization.template.tasks.DummyTask;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.core.task.TaskExecutor;
import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class ExecutorService {

	@Autowired
	private TaskService taskService;

	@Autowired
	private TaskExecutor taskExecutor;

	@Autowired
	private ApplicationContext applicationContext;

	public void execute(String taskName) {
		this.taskService.read(taskName).ifPresent(task -> {
			log.info("Execute Task: {}", task.getName());
			this.taskExecutor.execute(applicationContext.getBean(DummyTask.class, task));
		});
	}
	
	public void cancel(String taskName) {

		this.taskService.read(taskName).ifPresent(task -> {
			log.info("Cancel Task: {}", task.getName());
			// TODO
		});

	}
	
	public void scheduler(String taskName) {
		
	}
}
