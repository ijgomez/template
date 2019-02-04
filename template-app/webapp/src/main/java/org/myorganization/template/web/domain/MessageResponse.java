package org.myorganization.template.web.domain;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Class that models the information the application responds to and does not
 * correspond to the database information.
 * 
 * @author jizquierdo
 *
 */
@Getter @Setter @NoArgsConstructor
public class MessageResponse {

	/** Messages */
	private String message;
	
	private String details;
	
	private String causeBy;	

}
