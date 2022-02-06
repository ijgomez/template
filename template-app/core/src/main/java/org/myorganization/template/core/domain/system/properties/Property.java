package org.myorganization.template.core.domain.system.properties;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.SequenceGenerator;
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;

import org.myorganization.template.core.domain.base.TemplateEntity;
import org.myorganization.template.core.domain.base.TemplateEntityBase;
import org.springframework.validation.annotation.Validated;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(uniqueConstraints={@UniqueConstraint(name = "uk_property_key", columnNames={"key"})})
@Validated
@Data
@EqualsAndHashCode(callSuper=false)
public class Property extends TemplateEntityBase implements TemplateEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "property_seq")
	@SequenceGenerator(name = "property_seq", sequenceName = "property_seq", allocationSize = 1)
	private Long id;

	@Column(nullable = false)
	private String key;
	
	@Column(nullable = false)
	private String value;

}
