package org.myorganization.template.core.services.system;

import java.time.LocalDateTime;

import org.myorganization.template.core.domain.system.traces.Trace;
import org.myorganization.template.core.domain.system.traces.TraceType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotifyService {

	@Autowired
	private TraceService traceService;
	
	@Transactional
	public void notify(TraceType type, String message) {
		Trace trace;
		
		trace = new Trace();
		trace.setDatetime(LocalDateTime.now());
		trace.setType(type);
		trace.setMessage(message);
		
		this.traceService.create(trace);
	}
	
}
