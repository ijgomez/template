package org.myorganization.template.core.services.tasks;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.myorganization.template.core.domain.tasks.Task;
import org.myorganization.template.core.domain.tasks.TaskCriteria;
import org.myorganization.template.core.domain.tasks.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TaskService {

	@Autowired
	private TaskRepository taskRepository;
	
	@Transactional(readOnly = true)
	public List<Task> findAll() {
		List<Task> tasks = new ArrayList<>();
		for (Task task : this.taskRepository.findAll()) {
			tasks.add(task);
		}
		return tasks;
	}
	
	@Transactional(readOnly = true)
	public List<Task> findByCriteria(TaskCriteria criteria) {
		return this.taskRepository.findByCriteria(criteria);
	}
	
	@Transactional(readOnly = true)
	public Long countByCriteria(TaskCriteria criteria) {
		return this.taskRepository.countByCriteria(criteria);
	}
	
	@Transactional
	public Task create(Task task) {
		return this.taskRepository.save(task);
	}
	
	@Transactional(readOnly = true)
	public Task read(Long id) {
		Optional<Task> task = this.taskRepository.findById(id);
		if (task.isPresent()) {
			return task.get();
		} 
		//TODO Not Found Exception....
		return null;
	}
	
	@Transactional(readOnly = true)
	public Task read(String name) {
		Optional<Task> task = this.taskRepository.findByName(name);
		if (task.isPresent()) {
			return task.get();
		} 
		//TODO Not Found Exception....
		return null;
	}
	
	@Transactional
	public Task update(Long id, Task task) {
		Optional<Task> optional = this.taskRepository.findById(id);
		if (optional.isPresent()) {
			Task t = optional.get();
			t.setName(task.getName());
			t.setDescription(task.getDescription());
			return this.taskRepository.save(t);
		} 
		//TODO Not Found Exception....
		return null;
	}
	
	@Transactional
	public Long delete(Long id) {
		this.taskRepository.deleteById(id);
		return id;
	}
	
}
