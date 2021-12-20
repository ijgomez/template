package org.myorganization.template.web.security.model;

import javax.validation.constraints.NotNull;

import lombok.Data;

@Data
public class RefreshTokenVO {

	@NotNull
	private String refreshToken;
	
}
