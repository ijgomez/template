package org.myorganization.template.core.audit;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import org.myorganization.template.domain.enums.AuditSection;
import org.myorganization.template.domain.enums.OperationType;

/**
 * Marks a service method for automatic audit logging.
 * <p>
 * When a method annotated with {@code @Auditable} executes successfully,
 * the {@link AuditAspect} intercepts the call and records an audit log entry
 * with the configured operation type, section, and entity name.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Auditable {

    /**
     * The type of operation being performed.
     */
    OperationType operationType();

    /**
     * The application section/module where the operation occurs.
     */
    AuditSection section();

    /**
     * The name of the entity type affected by the operation.
     */
    String entityName();
}
