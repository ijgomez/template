package org.myorganization.template.web.security.exceptions;

public class InvalidCredentialsException extends Exception {

	private static final long serialVersionUID = 2396528091605974109L;

	public InvalidCredentialsException(String message) {
		super(message);
	}
	
	public InvalidCredentialsException(String message, Throwable cause) {
		super(message, cause);
	}

}
