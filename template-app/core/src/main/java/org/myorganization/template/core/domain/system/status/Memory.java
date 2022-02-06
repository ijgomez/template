package org.myorganization.template.core.domain.system.status;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class Memory {

	private Long max;
	
	private Long total;
	
	private Long free;
	
	private Long used;
}
