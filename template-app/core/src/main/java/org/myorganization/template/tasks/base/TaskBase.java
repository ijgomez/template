package org.myorganization.template.tasks.base;

import java.time.Duration;
import java.time.LocalDateTime;

import org.myorganization.template.core.domain.tasks.Task;
import org.myorganization.template.core.domain.tasks.TaskExecution;
import org.myorganization.template.core.domain.tasks.TaskExecutionAction;
import org.myorganization.template.core.domain.tasks.TaskExecutionStatus;
import org.myorganization.template.scheduler.services.TaskExecutionService;
import org.springframework.beans.factory.annotation.Autowired;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public abstract class TaskBase implements Runnable {

	private Thread thread;
	
	private ControlTimer heartbeatTimer;
	
	private ControlTimer userControlTimer;
	
	private TaskExecution taskExecution;
	
	private Task task;

	@Autowired
	private TaskExecutionService executionTaskService;
	
	protected TaskBase(Task task) {
		this.task = task;
		taskExecution = new TaskExecution();
		taskExecution.setTask(task);
		this.heartbeatTimer = new ControlTimer(this::heartbeat, 1000);
		this.userControlTimer = new ControlTimer(this::checkStatusTask, 1000);
	}
	
	private void notifyStart(LocalDateTime dispatchedAt) {
		taskExecution.setDispatchedAt(dispatchedAt);
		taskExecution.setStatus(TaskExecutionStatus.RUN);
		taskExecution = this.executionTaskService.create(taskExecution);
	}

	public void run() {
		log.debug("Start {} process... {}", this.task.getName(), this.hashCode());
		LocalDateTime datetime = LocalDateTime.now();
		try {
			notifyStart(datetime);
			this.thread = Thread.currentThread();
			this.heartbeatTimer.start();
			this.userControlTimer.start();
			
			handlerRun();
			
		} catch (Exception e) {
			notifyError();
		} finally {
			this.userControlTimer.stop();
			this.heartbeatTimer.stop();
			notifyEnd(Duration.between(datetime, LocalDateTime.now()));
			log.debug("...End {} process in ms.", this.task.getName());
		}
	}

	protected abstract void handlerRun() throws Exception;
	
	protected void notifyError() {
		// TODO Auto-generated method stub
	}

	protected void notifyEnd(Duration duration) {
		taskExecution.setStatus(TaskExecutionStatus.FINISH);
		taskExecution.setDuration(duration);
		
		executionTaskService.update(taskExecution.getId(), taskExecution);
	}

	private void checkStatusTask() {
		TaskExecutionAction action;
		
		action = this.getStatusTask();
		if (action != null && action.equals(TaskExecutionAction.STOP)) {
			this.stop();
		}
		// TODO Auto-generated method stub
	}

	public void stop() {
		this.thread.interrupt();
	}

	protected void heartbeat() {
		// TODO Auto-generated method stub
	}

	protected TaskExecutionAction getStatusTask() {
		// TODO Auto-generated method stub
		return null;
	}
}
