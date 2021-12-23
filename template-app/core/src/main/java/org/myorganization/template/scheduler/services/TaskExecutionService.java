package org.myorganization.template.scheduler.services;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.myorganization.template.scheduler.domain.taskexecutions.TaskExecution;
import org.myorganization.template.scheduler.domain.taskexecutions.TaskExecutionCriteria;
import org.myorganization.template.scheduler.domain.taskexecutions.TaskExecutionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TaskExecutionService {

	@Autowired
	private TaskExecutionRepository taskExecutionRepository;
	
	@Transactional(readOnly = true)
	public List<TaskExecution> findAll() {
		List<TaskExecution> taskExecutions = new ArrayList<>();
		for (TaskExecution executionTask : this.taskExecutionRepository.findAll()) {
			taskExecutions.add(executionTask);
		}
		return taskExecutions;
	}
	
	@Transactional(readOnly = true)
	public List<TaskExecution> findByCriteria(TaskExecutionCriteria criteria) {
		return this.taskExecutionRepository.findByCriteria(criteria);
	}
	
	@Transactional(readOnly = true)
	public Long countByCriteria(TaskExecutionCriteria criteria) {
		return this.taskExecutionRepository.countByCriteria(criteria);
	}
	
	@Transactional
	public TaskExecution create(TaskExecution executionTask) {
		return this.taskExecutionRepository.save(executionTask);
	}
	
	@Transactional(readOnly = true)
	public TaskExecution read(Long id) {
		Optional<TaskExecution> taskExecution = this.taskExecutionRepository.findById(id);
		if (taskExecution.isPresent()) {
			return taskExecution.get();
		} 
		//TODO Not Found Exception....
		return null;
	}
	
	@Transactional
	public TaskExecution update(Long id, TaskExecution taskExecution) {
		Optional<TaskExecution> optional = this.taskExecutionRepository.findById(id);
		if (optional.isPresent()) {
			TaskExecution te = optional.get();
			taskExecution.setId(te.getId());
			
			return this.taskExecutionRepository.save(taskExecution);
		} 
		//TODO Not Found Exception....
		return null;
	}
	
	@Transactional
	public Long delete(Long id) {
		this.taskExecutionRepository.deleteById(id);
		return id;
	}

}
