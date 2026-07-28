package org.myorganization.template.webapp.config;

import java.util.TimeZone;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;

/**
 * Configures the JVM default timezone to UTC.
 * <p>
 * Ensures all timestamp operations (JPA, JSON serialization, logging)
 * operate in UTC regardless of the host system's timezone.
 */
@Configuration
public class TimezoneConfig {

    private static final Logger log = LoggerFactory.getLogger(TimezoneConfig.class);

    @PostConstruct
    public void init() {
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
        log.info("JVM default timezone set to UTC");
    }

}
