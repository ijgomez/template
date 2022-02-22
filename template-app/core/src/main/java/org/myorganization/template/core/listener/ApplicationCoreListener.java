package org.myorganization.template.core.listener;

import java.util.Arrays;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class ApplicationCoreListener {

	@Autowired
	private Environment environment;
	
	private boolean isStarting = true;

	@EventListener
    public void handleContextRefresh(ContextRefreshedEvent event) {
		
		if (this.isStarting) {
			log.info("Environment: {}", Arrays.asList(environment.getDefaultProfiles()));
			
			
			this.isStarting = false;
		}
	}

}
