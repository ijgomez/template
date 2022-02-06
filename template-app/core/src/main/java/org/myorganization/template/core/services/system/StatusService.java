package org.myorganization.template.core.services.system;

import java.util.Calendar;
import java.util.Properties;

import org.myorganization.template.core.domain.system.status.Memory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StatusService {
	
	@Transactional(readOnly = true)
	public Calendar getServerTimestamp() {
		return Calendar.getInstance();
	}
	
	/**
	 * View of the current system environment.
	 * @return Returns an unmodifiable string map.
	 */
	@Transactional(readOnly = true)
	public Properties getCurrentProperties() {
		return System.getProperties();
	}
	
	@Transactional(readOnly = true)
	public Memory getMemory() {
		Memory memory;
		
		memory = new Memory();
		memory.setMax(Runtime.getRuntime().maxMemory());
		memory.setTotal(Runtime.getRuntime().totalMemory());
		memory.setFree(Runtime.getRuntime().freeMemory());
		memory.setUsed(memory.getTotal() - memory.getFree());
		
		return memory;
	}
	
	@Transactional(readOnly = true)
	public int getAvailableProcessors() {
		return Runtime.getRuntime().availableProcessors();
	}
}
