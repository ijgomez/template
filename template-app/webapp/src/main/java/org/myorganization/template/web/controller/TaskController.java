package org.myorganization.template.web.controller;

import java.net.URI;
import java.util.List;

import org.myorganization.template.core.domain.tasks.Task;
import org.myorganization.template.core.domain.tasks.TaskCriteria;
import org.myorganization.template.core.helper.FileHelper;
import org.myorganization.template.core.services.executor.ExecutorService;
import org.myorganization.template.core.services.tasks.TaskService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

/**
 * Task Controller.
 * @author ijgomez
 *
 */
@RestController
@RequestMapping("/api/tasks")
public class TaskController {
	
	private static final Logger LOGGER = LoggerFactory.getLogger(TaskController.class);
	
	@Autowired
	private TaskService taskService;
	
	@Autowired
	private ExecutorService executorService;

	/**
	 * List all Tasks.
	 * @return List.
	 */
	@GetMapping
	public ResponseEntity<List<Task>> findAll() {
		List<Task> tasks = taskService.findAll();
		if (tasks.isEmpty()) {
			return ResponseEntity.noContent().build();
		}
		return ResponseEntity.ok(tasks);
	}
	
	/**
	 * List by criteria.
	 * @return List.
	 */
	@PostMapping("/search")
	public ResponseEntity<List<Task>> findByCriteria(@RequestBody TaskCriteria criteria) {
		
		LOGGER.info("find by criteria: " + criteria);
		
		List<Task> tasks = taskService.findByCriteria(criteria);
		if (tasks.isEmpty()) {
			return ResponseEntity.noContent().build();
		}
		return ResponseEntity.ok(tasks);
	}
	
	@PostMapping("/count")
	public ResponseEntity<Long> countByCriteria(@RequestBody TaskCriteria criteria) {
		
		LOGGER.info("find by criteria: " + criteria);
		
		Long records = taskService.countByCriteria(criteria);

		return ResponseEntity.ok(records);
	}
	
	/**
	 * Create a new Task.
	 * @param task New Task.
	 * @return Return of Task.
	 */
	@PostMapping
	public ResponseEntity<Task> create(@RequestBody Task task) {
		task = this.taskService.create(task);
		
		if (task == null) {
			return ResponseEntity.noContent().build();
		}

		URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(task.getId()).toUri();
		return ResponseEntity.created(location).build();
	}
	
	/**
	 * Read a single task.
	 * @param id Id of Task.
	 * @return
	 */
	@GetMapping("/{id}")
	public ResponseEntity<Task> read(@PathVariable("id") Long id) {
		Task task = this.taskService.read(id);
		if (task == null) {
			return ResponseEntity.notFound().build();
		}

		return ResponseEntity.ok(task);
	}

	/**
	 * Update task attributes.
	 * @param id Id of Task.
	 * @param report Task with new attributes.
	 * @return
	 */
	@PutMapping("/{id}")
	public ResponseEntity<Task> update(@PathVariable Long id, @RequestBody Task task) {
		
		LOGGER.info("update {} - {}", id, task);
		
		task = this.taskService.update(id, task);
		if (null == task) {
			return ResponseEntity.notFound().build();
		}

		return ResponseEntity.ok(task);
	}

	/**
	 * Delete of a Task.
	 * @param id Id of Task.
	 * @return
	 */
	@DeleteMapping("/{id}")
	public ResponseEntity<Long> delete(@PathVariable("id") Long id) {
		
		if (null == this.taskService.delete(id)) {
			return ResponseEntity.notFound().build();
		}

		return ResponseEntity.ok(id);
	}
	
	@GetMapping("/export")
	public ResponseEntity<Resource> export() throws Exception {
		ByteArrayResource resource;
		
		List<Task> data = this.taskService.findByCriteria(new TaskCriteria());
		byte[] csv = FileHelper.toCsvByteArray(data);
		resource = new ByteArrayResource(csv);

		HttpHeaders headers = new HttpHeaders();
		headers.add("Content-disposition", "attachment;filename=export-" + System.currentTimeMillis() + ".csv");
		headers.add("Cache-Control", "no-cache, no-store, must-revalidate");
		headers.add("Pragma", "no-cache");
		headers.add("Expires", "0");

		return ResponseEntity.ok().headers(headers).contentLength(csv.length).contentType(MediaType.parseMediaType("txt/csv")).body(resource);
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

}
