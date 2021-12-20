package org.myorganization.template.web.security.model;

import javax.validation.constraints.NotNull;

import lombok.Data;

@Data
public class CredentialsVO {

	@NotNull
	private String username;
	
	@NotNull
	private String password;
	
}
