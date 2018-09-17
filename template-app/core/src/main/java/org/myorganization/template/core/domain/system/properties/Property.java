package org.myorganization.template.core.domain.system.properties;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.SequenceGenerator;

import org.myorganization.template.core.domain.base.TemplateEntity;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter @Setter @NoArgsConstructor
public class Property extends TemplateEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "property_seq")
	@SequenceGenerator(name = "property_seq", sequenceName = "property_seq", allocationSize = 1)
	private Long id;

	@Column(nullable = false)
	private String property;
	
	@Column(nullable = false)
	private String value;

}
