package org.myorganization.template.web.controller;

import org.myorganization.template.scheduler.domain.tasks.Task;
import org.myorganization.template.scheduler.domain.tasks.TaskCriteria;
import org.myorganization.template.scheduler.services.ExecutorService;
import org.myorganization.template.scheduler.services.TaskService;
import org.myorganization.template.web.controller.base.TemplateController;
import org.myorganization.template.web.controller.base.TemplateControllerBase;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Task Controller.
 * @author ijgomez
 *
 */
@RestController
@Validated
@RequestMapping("/api/tasks")
public class TaskController extends TemplateControllerBase<Task, TaskCriteria> implements TemplateController<Task, TaskCriteria> {

	@Autowired
	private ExecutorService executorService;
	
	@Autowired
	public TaskController(TaskService taskService) {
		super(taskService);
	}

	
	/**
	 * Execute a current Task.
	 * @param taskName Task name.
	 * @return .
	 */
	@PostMapping("/{taskName}/execute")
	public ResponseEntity<String> execute(@PathVariable String taskName) {
		
		this.executorService.execute(taskName);
		
		return ResponseEntity.accepted().build();
	}
	
	/**
	 * Execute a current Task.
	 * @param taskName Task name.
	 * @return .
	 */
	@PostMapping("/{taskName}/cancel")
	public ResponseEntity<String> cancel(@PathVariable String taskName) {
		
		this.executorService.cancel(taskName);
		
		return ResponseEntity.accepted().build();
	}
	
	/**
	 * Execute a current Task.
	 * @param taskName Task name.
	 * @return .
	 */
	@PostMapping("/{taskName}/schedule")
	public ResponseEntity<String> schedule(@PathVariable String taskName) {
		
		//TODO ;
		
		return ResponseEntity.accepted().build();
	}

}
