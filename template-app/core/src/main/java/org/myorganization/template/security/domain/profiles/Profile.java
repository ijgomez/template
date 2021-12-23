package org.myorganization.template.security.domain.profiles;

import java.util.Set;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.JoinTable;
import javax.persistence.ManyToMany;
import javax.persistence.OneToMany;
import javax.persistence.SequenceGenerator;

import org.myorganization.template.core.domain.base.TemplateEntity;
import org.myorganization.template.core.domain.base.TemplateEntityBase;
import org.myorganization.template.security.domain.actions.Action;
import org.myorganization.template.security.domain.users.User;
import org.springframework.validation.annotation.Validated;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

@Entity
@Validated
@Data
@EqualsAndHashCode(callSuper=false, exclude = "users")
@ToString(exclude = "users")
public class Profile extends TemplateEntityBase implements TemplateEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "profile_seq")
	@SequenceGenerator(name = "profile_seq", sequenceName = "profile_seq", allocationSize = 1)
	private Long id;

	@Column(nullable = false)
	private String name;
	
	@Column(nullable = false)
	private String description;
	
	@OneToMany(mappedBy="profile")
	@JsonIgnore
	private Set<User> users;
	
	@ManyToMany()
    @JoinTable(
        joinColumns = { @JoinColumn(name = "profile_id") }, 
        inverseJoinColumns = { @JoinColumn(name = "action_id") }
    )
	private Set<Action> actions;

}
