package org.myorganization.template.core.services.tasks;

import java.util.List;
import java.util.Optional;

import org.myorganization.template.core.domain.tasks.Task;
import org.myorganization.template.core.domain.tasks.TaskCriteria;
import org.myorganization.template.core.domain.tasks.TaskRepository;
import org.myorganization.template.core.services.base.TemplateService;
import org.myorganization.template.core.services.base.TemplateServiceBase;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TaskService extends TemplateServiceBase<Task, TaskCriteria> implements TemplateService<Task, TaskCriteria> {

	@Autowired
	public TaskService(TaskRepository taskRepository) {
		super(taskRepository);
	}

	@Transactional(readOnly = true)
	public List<Task> findByCriteria(TaskCriteria criteria) {
		return ((TaskRepository) super.getRepository()).findByCriteria(criteria);
	}
	
	@Transactional(readOnly = true)
	public Long countByCriteria(TaskCriteria criteria) {
		return ((TaskRepository) super.getRepository()).countByCriteria(criteria);
	}

	@Transactional(readOnly = true)
	public Optional<Task> read(String name) {
		return ((TaskRepository) super.getRepository()).findByName(name);
	}
	
	@Transactional
	public Task update(Long id, Task task) {
		return this.read(id).map(t -> {
			
			t.setName(task.getName());
			t.setDescription(task.getDescription());
			
			return super.getRepository().save(t);
		}).orElseGet(() -> null);
	}
	
}
