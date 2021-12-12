package org.myorganization.template.core.domain.tasks;

import java.util.Set;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.OneToMany;
import javax.persistence.SequenceGenerator;

import org.myorganization.template.core.domain.base.TemplateEntity;
import org.myorganization.template.core.domain.base.TemplateEntityBase;
import org.springframework.validation.annotation.Validated;

import com.fasterxml.jackson.annotation.JsonBackReference;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Validated
@Data
@EqualsAndHashCode(callSuper=false)
public class Task extends TemplateEntityBase implements TemplateEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "task_seq")
	@SequenceGenerator(name = "task_seq", sequenceName = "task_seq", allocationSize = 1)
	private Long id;

	@Column(nullable = false)
	private String name;
	
	@Column(nullable = false)
	private String description;
	
	@OneToMany(mappedBy="task")
	@JsonBackReference
	private Set<TaskExecution> executions;

	
}
