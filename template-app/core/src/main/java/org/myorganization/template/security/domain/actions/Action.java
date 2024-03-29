package org.myorganization.template.security.domain.actions;

import java.util.Set;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.ManyToMany;
import javax.persistence.SequenceGenerator;
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;

import org.myorganization.template.core.domain.base.TemplateEntityBase;
import org.myorganization.template.security.domain.profiles.Profile;
import org.springframework.validation.annotation.Validated;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.opencsv.bean.CsvBindByName;
import com.opencsv.bean.CsvBindByPosition;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

@Entity
@Table(uniqueConstraints={@UniqueConstraint(name = "uk_action_name", columnNames={"name"})})
@Validated
@Data
@EqualsAndHashCode(callSuper=false, exclude = "profiles")
@ToString(exclude = "profiles")
public class Action extends TemplateEntityBase {

	@Id
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "action_seq")
	@SequenceGenerator(name = "action_seq", sequenceName = "action_seq", allocationSize = 1)
	private Long id;

	@Column(nullable = false)
	@CsvBindByName
	@CsvBindByPosition(position = 0)
	private String name;
	
	@Column(nullable = false)
	@CsvBindByName
	@CsvBindByPosition(position = 1)
	private String description;

	@ManyToMany(mappedBy = "actions")
	@JsonIgnore
	private Set<Profile> profiles;

}
