package org.myorganization.template.scheduler.listener;

import java.util.Arrays;

import org.myorganization.template.scheduler.annotations.TemplateTaskAnnotation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.core.type.filter.AnnotationTypeFilter;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class ApplicationSchedulerListener {

	@Autowired
	private Environment environment;
	
	private boolean isStarting = true;

	@EventListener
    public void handleContextRefresh(ContextRefreshedEvent event) {
		ClassPathScanningCandidateComponentProvider scanner;
		
		if (this.isStarting) {
			log.info("Environment: {}", Arrays.asList(environment.getDefaultProfiles()));
			
			scanner = new ClassPathScanningCandidateComponentProvider(false);
			scanner.addIncludeFilter(new AnnotationTypeFilter(TemplateTaskAnnotation.class));
			
			scanner.findCandidateComponents("org.myorganization.template.tasks").forEach(bd -> {
				
				System.out.println(bd.getBeanClassName());
				
			});
			
			this.isStarting = false;
		}
		
			    

	}

}
