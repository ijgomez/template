package org.myorganization.template.web.controller;

import java.util.Date;
import java.util.Properties;

import org.myorganization.template.core.domain.system.status.Memory;
import org.myorganization.template.core.services.system.StatusService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Status Controller.
 * @author ijgomez
 *
 */
@RestController
@Validated
@RequestMapping("/api/status")
public class StatusController {
	
	@Autowired
	private StatusService statusService;
	
	/**
	 * Server timestamp.
	 * @return Date.
	 */
	@GetMapping("/time")
	public Date getServerTimestamp() {
		return this.statusService.getServerTimestamp().getTime();
	}
	
	@GetMapping("/properties")
	public Properties getCurrentProperties() {
		return this.statusService.getCurrentProperties();
	}
	
	@GetMapping("/memory")
	public Memory getMemory() {
		return this.statusService.getMemory();
	}

}
