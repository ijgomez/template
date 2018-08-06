package org.myorganization.template.web.domain;

/**
 * Class that models the information the application responds to and does not
 * correspond to the database information.
 * 
 * @author jizquierdo
 *
 */
public class MessageResponse {

	/** Messages */
	private String message;

	/**
	 * New Instance.
	 */
	public MessageResponse() {

	}

	public String getMessage() {
		return message;
	}

	public void setMessage(String message) {
		this.message = message;
	}

}
