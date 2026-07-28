package org.myorganization.template.core.audit;

import org.myorganization.template.core.service.AuditService;
import org.myorganization.template.domain.dto.AuditLogEntry;
import org.myorganization.template.domain.enums.OperationType;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * AOP aspect that intercepts service methods annotated with {@link Auditable}
 * and records audit log entries after successful execution.
 * <p>
 * Audit errors are caught and logged at ERROR level but never propagated to
 * the business operation, ensuring audit failures do not affect business logic.
 * <p>
 * This aspect is independent of entity created_at/last_modified_at fields.
 */
@Aspect
@Component
public class AuditAspect {

    private static final Logger log = LoggerFactory.getLogger(AuditAspect.class);

    private final AuditService auditService;

    public AuditAspect(AuditService auditService) {
        this.auditService = auditService;
    }

    /**
     * Intercepts methods annotated with {@link Auditable} after they return successfully
     * and records an audit log entry via the {@link AuditService}.
     *
     * @param joinPoint  the join point providing method context
     * @param auditable  the annotation instance with audit metadata
     * @param result     the method return value (used to extract entity ID)
     */
    @AfterReturning(pointcut = "@annotation(auditable)", returning = "result")
    public void afterAuditableMethod(JoinPoint joinPoint, Auditable auditable, Object result) {
        try {
            String username = extractUsername();
            String entityId = extractEntityId(result, joinPoint.getArgs());
            String detail = buildDetail(auditable.operationType(), joinPoint.getArgs());

            AuditLogEntry entry = new AuditLogEntry(
                    username,
                    auditable.operationType(),
                    auditable.section(),
                    entityId,
                    auditable.entityName(),
                    detail
            );

            auditService.log(entry);
        } catch (Exception e) {
            log.error("Failed to record audit log for method {}: {}",
                    joinPoint.getSignature().toShortString(), e.getMessage(), e);
        }
    }

    /**
     * Extracts the username from the Spring Security context.
     *
     * @return the authenticated username, or "SYSTEM" if no authentication is present
     */
    private String extractUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            return authentication.getName();
        }
        return "SYSTEM";
    }

    /**
     * Extracts the entity ID from the method return value or arguments.
     * <p>
     * Strategy:
     * <ol>
     *   <li>If the return value has a getId() method, use it</li>
     *   <li>If the return value is a record with an id() accessor, use it</li>
     *   <li>If the first argument is a numeric type (Long/Integer), use it as entity ID</li>
     *   <li>If the first argument is a String, use it as entity ID</li>
     *   <li>Otherwise return null</li>
     * </ol>
     *
     * @param result the method return value
     * @param args   the method arguments
     * @return the entity ID as string, or null
     */
    private String extractEntityId(Object result, Object[] args) {
        // Try from return value (DTO records typically have id() method)
        if (result != null) {
            String id = extractIdFromObject(result);
            if (id != null) {
                return id;
            }
        }

        // Fall back to first argument (for delete operations where ID is the parameter)
        if (args != null && args.length > 0) {
            Object firstArg = args[0];
            if (firstArg instanceof Long || firstArg instanceof Integer) {
                return firstArg.toString();
            }
            if (firstArg instanceof String) {
                return (String) firstArg;
            }
        }

        return null;
    }

    /**
     * Attempts to extract an ID from an object via reflection.
     * Supports both records (id() method) and entities (getId() method).
     */
    private String extractIdFromObject(Object obj) {
        // Try id() method (Java records)
        try {
            var method = obj.getClass().getMethod("id");
            Object id = method.invoke(obj);
            if (id != null) {
                return id.toString();
            }
        } catch (NoSuchMethodException e) {
            // Not a record or no id() method, try getId()
        } catch (Exception e) {
            log.debug("Could not extract id() from result: {}", e.getMessage());
        }

        // Try getId() method (JPA entities)
        try {
            var method = obj.getClass().getMethod("getId");
            Object id = method.invoke(obj);
            if (id != null) {
                return id.toString();
            }
        } catch (NoSuchMethodException e) {
            // No getId() method available
        } catch (Exception e) {
            log.debug("Could not extract getId() from result: {}", e.getMessage());
        }

        return null;
    }

    /**
     * Builds a detail string for the audit entry based on the operation type.
     * For DELETE operations, includes the entity ID from arguments.
     *
     * @param operationType the type of operation
     * @param args          the method arguments
     * @return a detail string, or null if no meaningful detail can be constructed
     */
    private String buildDetail(OperationType operationType, Object[] args) {
        if (operationType == OperationType.DELETE && args != null && args.length > 0) {
            return "Deleted entity with id: " + args[0];
        }
        return null;
    }
}
