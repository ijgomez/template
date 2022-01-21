package org.myorganization.template.security.domain.users;

import java.time.ZonedDateTime;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.ForeignKey;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.SequenceGenerator;
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;

import org.myorganization.template.core.domain.base.TemplateEntity;
import org.myorganization.template.core.domain.base.TemplateEntityBase;
import org.myorganization.template.security.domain.profiles.Profile;
import org.springframework.validation.annotation.Validated;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(uniqueConstraints={@UniqueConstraint(name = "uk_user_username", columnNames={"username"})})
@Validated
@Data
@EqualsAndHashCode(callSuper=false)
public class User extends TemplateEntityBase implements TemplateEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "user_seq")
	@SequenceGenerator(name = "user_seq", sequenceName = "user_seq", allocationSize = 1)
	private Long id;

	@Column(nullable = false)
	private String username;
	
	@Column(nullable = false)
	private String password;

	private ZonedDateTime lastAccess;
	
	@ManyToOne
	@JoinColumn(name="profile_fk", foreignKey = @ForeignKey(name="fk_user_profile"))
	private Profile profile;

}
