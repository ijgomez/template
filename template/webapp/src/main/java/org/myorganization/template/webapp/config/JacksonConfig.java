package org.myorganization.template.webapp.config;

import java.util.TimeZone;

import org.springframework.boot.jackson.autoconfigure.JsonMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import tools.jackson.databind.cfg.DateTimeFeature;

/**
 * Jackson ObjectMapper customization for consistent date/time serialization.
 * <p>
 * Ensures all API responses serialize timestamps in ISO 8601 format with UTC
 * timezone (Z suffix). Works alongside spring.jackson.* properties in application.yml.
 */
@Configuration
public class JacksonConfig {

    @Bean
    JsonMapperBuilderCustomizer utcTimezoneCustomizer() {
        return builder -> builder
                .defaultTimeZone(TimeZone.getTimeZone("UTC"))
                .disable(DateTimeFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

}
