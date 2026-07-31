package org.myorganization.template.webapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * Spring Boot application entry point.
 * Extends SpringBootServletInitializer for WAR deployment.
 */
@SpringBootApplication(scanBasePackages = "org.myorganization.template")
@EntityScan(basePackages = "org.myorganization.template.domain.entity")
@EnableJpaRepositories(basePackages = "org.myorganization.template.core.repository")
public class TemplateApplication extends SpringBootServletInitializer {

    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder builder) {
        return builder.sources(TemplateApplication.class);
    }

    public static void main(String[] args) {
        SpringApplication.run(TemplateApplication.class, args);
    }

}
