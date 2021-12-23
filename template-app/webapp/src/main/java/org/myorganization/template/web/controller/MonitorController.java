package org.myorganization.template.web.controller;

import java.util.List;

import org.myorganization.template.scheduler.domain.taskexecutions.TaskExecution;
import org.myorganization.template.scheduler.services.TaskExecutionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Monitor Controller.
 * @author ijgomez
 *
 */
@RestController
@RequestMapping("/api/monitor")
public class MonitorController {
	
	@Autowired
	private TaskExecutionService executionTaskService;
	
	/**
	 * Server timestamp.
	 * @return List.
	 */
	@GetMapping("/tasks")
	public List<TaskExecution> getExecutionTasks() {
		return this.executionTaskService.findAll();
	}

}
