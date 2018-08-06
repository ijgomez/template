package org.myorganization.template.web.controller;

import java.util.Date;

import org.myorganization.template.core.services.system.StatusService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Status Controller.
 * @author ijgomez
 *
 */
@RestController
@RequestMapping("/api/status")
public class StatusController {
	
	@Autowired
	private StatusService statusService;
	
	/**
	 * Server timestamp.
	 * @return List.
	 */
	@GetMapping("/time")
	public Date getServerTimestamp() {
		return this.statusService.getServerTimestamp().getTime();
	}

}
