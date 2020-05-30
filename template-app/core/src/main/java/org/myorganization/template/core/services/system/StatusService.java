package org.myorganization.template.core.services.system;

import java.util.Calendar;

import org.springframework.stereotype.Service;

@Service
public class StatusService {
	
	public Calendar getServerTimestamp() {
		return Calendar.getInstance();
	}
	
}
