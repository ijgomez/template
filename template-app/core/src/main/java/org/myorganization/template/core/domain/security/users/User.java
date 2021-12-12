package org.myorganization.template.core.domain.security.users;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import javax.persistence.SequenceGenerator;

import org.myorganization.template.core.domain.base.TemplateEntity;
import org.myorganization.template.core.domain.security.profiles.Profile;
import org.springframework.validation.annotation.Validated;

import com.fasterxml.jackson.annotation.JsonManagedReference;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Validated
@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = false)
public class User extends TemplateEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "user_seq")
	@SequenceGenerator(name = "user_seq", sequenceName = "user_seq", allocationSize = 1)
	private Long id;

	@Column(nullable = false)
	private String username;
	
	@Column(nullable = false)
	private String password;
	
	@ManyToOne
	@JsonManagedReference
	private Profile profile;
	
	public User(String username, String password) {
		super();
		this.username = username;
		this.password = password;
	}

}
