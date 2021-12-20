package org.myorganization.template.web.security.exceptions;

public class UserNotFoundException extends Exception {

	private static final long serialVersionUID = 6521169949225539356L;

	public UserNotFoundException(String message) {
		super(message);
	}
	
	public UserNotFoundException(String message, Throwable cause) {
		super(message, cause);
	}

}
