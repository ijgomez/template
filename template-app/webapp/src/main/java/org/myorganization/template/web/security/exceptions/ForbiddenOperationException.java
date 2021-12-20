package org.myorganization.template.web.security.exceptions;

public class ForbiddenOperationException extends Exception {

	private static final long serialVersionUID = -6705166114954844333L;

	public ForbiddenOperationException(String message) {
		super(message);
	}
	
	public ForbiddenOperationException(String message, Throwable cause) {
		super(message, cause);
	}

}
