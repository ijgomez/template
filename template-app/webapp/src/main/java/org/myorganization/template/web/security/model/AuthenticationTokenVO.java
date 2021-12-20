package org.myorganization.template.web.security.model;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthenticationTokenVO {

	private String type;
	
	private String accessToken;
	
	private String refreshToken;
	
	private int expiresIn;
	
}
