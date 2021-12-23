package org.myorganization.template.scheduler.domain.taskexecutions;

import java.time.Duration;
import java.time.LocalDateTime;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import javax.persistence.SequenceGenerator;

import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.myorganization.template.scheduler.domain.tasks.Task;

import com.fasterxml.jackson.annotation.JsonManagedReference;

@Entity
public class TaskExecution {

	@Id
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "task_execution_seq")
	@SequenceGenerator(name = "task_execution_seq", sequenceName = "task_execution_seq", allocationSize = 1)
	private Long id;

	@ManyToOne
	@JsonManagedReference
	private Task task;

	@Column(nullable = false)
	private LocalDateTime dispatchedAt;

	@Column
	private Duration duration;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private TaskExecutionStatus status;

	@Column
	private String owner;

	public TaskExecution() {
		super();
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Task getTask() {
		return task;
	}

	public void setTask(Task task) {
		this.task = task;
	}

	public LocalDateTime getDispatchedAt() {
		return dispatchedAt;
	}

	public void setDispatchedAt(LocalDateTime dispatchedAt) {
		this.dispatchedAt = dispatchedAt;
	}

	public Duration getDuration() {
		return duration;
	}
	
	public void setDuration(Duration duration) {
		this.duration = duration;
	}
	
	public TaskExecutionStatus getStatus() {
		return status;
	}

	public void setStatus(TaskExecutionStatus status) {
		this.status = status;
	}

	public String getOwner() {
		return owner;
	}

	public void setOwner(String owner) {
		this.owner = owner;
	}

	@Override
	public int hashCode() {
		return HashCodeBuilder.reflectionHashCode(this, true);
	}

	@Override
	public boolean equals(Object obj) {
		return EqualsBuilder.reflectionEquals(this, obj, true);
	}

	@Override
	public String toString() {
		return ToStringBuilder.reflectionToString(this);
	}
}
