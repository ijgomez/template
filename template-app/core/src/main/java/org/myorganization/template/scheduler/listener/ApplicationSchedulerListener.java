package org.myorganization.template.scheduler.listener;

import java.util.Arrays;

import org.myorganization.template.scheduler.annotations.TemplateTaskAnnotation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.core.type.filter.AnnotationTypeFilter;
import org.springframework.stereotype.Component;

@Component
public class ApplicationSchedulerListener {
	
	private static final Logger LOGGER = LoggerFactory.getLogger(ApplicationSchedulerListener.class);

	@Autowired
	private Environment environment;

	@EventListener
    public void handleContextRefresh(ContextRefreshedEvent event) {
		
		LOGGER.info("Environment: " + Arrays.asList(environment.getDefaultProfiles()));
		
		ClassPathScanningCandidateComponentProvider scanner =
				new ClassPathScanningCandidateComponentProvider(false);

				scanner.addIncludeFilter(new AnnotationTypeFilter(TemplateTaskAnnotation.class));

				for (BeanDefinition bd : scanner.findCandidateComponents("org.myorganization.template.tasks"))
				    System.out.println(bd.getBeanClassName());

	}

}
