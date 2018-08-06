package org.myorganization.template.core.listener;

import java.util.Arrays;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class ApplicationCoreListener {
	
	private static final Logger LOGGER = LoggerFactory.getLogger(ApplicationCoreListener.class);

	@Autowired
	private Environment environment;

	@EventListener
    public void handleContextRefresh(ContextRefreshedEvent event) {
		
		LOGGER.info("Environment: " + Arrays.asList(environment.getDefaultProfiles()));

	}

}
