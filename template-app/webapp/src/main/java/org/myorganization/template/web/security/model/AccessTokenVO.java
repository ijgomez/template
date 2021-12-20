package org.myorganization.template.web.security.model;

import javax.validation.constraints.NotNull;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AccessTokenVO {

	@NotNull
	private String accessToken;
	
}
