package org.myorganization.template.webapp;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.time.Duration;
import java.time.Instant;
import java.util.Set;

import org.myorganization.template.core.repository.ClusterNodeRepository;
import org.myorganization.template.core.service.AuditService;
import org.myorganization.template.domain.dto.AuditLogEntry;
import org.myorganization.template.domain.entity.ClusterNode;
import org.myorganization.template.domain.enums.AuditSection;
import org.myorganization.template.domain.enums.OperationType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.config.CronTask;
import org.springframework.scheduling.config.FixedDelayTask;
import org.springframework.scheduling.config.FixedRateTask;
import org.springframework.scheduling.config.ScheduledTask;
import org.springframework.scheduling.config.ScheduledTaskHolder;
import org.springframework.scheduling.config.Task;
import org.springframework.stereotype.Component;

/**
 * Executes startup tasks after the application context is fully initialized.
 * <p>
 * On application ready:
 * <ul>
 *   <li>Logs all active scheduled tasks (@Scheduled) registered in the application</li>
 *   <li>Records an audit log entry indicating the instance has started</li>
 * </ul>
 */
@Component
public class TemplateApplicationStartup {

    private static final Logger log = LoggerFactory.getLogger(TemplateApplicationStartup.class);

    private final ScheduledTaskHolder scheduledTaskHolder;
    private final ClusterNodeRepository clusterNodeRepository;
    private final AuditService auditService;

    public TemplateApplicationStartup(ScheduledTaskHolder scheduledTaskHolder,
                                      ClusterNodeRepository clusterNodeRepository,
                                      AuditService auditService) {
        this.scheduledTaskHolder = scheduledTaskHolder;
        this.clusterNodeRepository = clusterNodeRepository;
        this.auditService = auditService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        String hostname = getHostname();
        log.info("Application started on node: {}", hostname);

        logScheduledTasks();
        auditApplicationStartup(hostname);
    }

    /**
     * Logs all active scheduled tasks registered in the application context.
     */
    private void logScheduledTasks() {
        Set<ScheduledTask> tasks = scheduledTaskHolder.getScheduledTasks();

        if (tasks.isEmpty()) {
            log.info("No scheduled tasks registered");
        } else {
            log.info("Active scheduled tasks ({} total):", tasks.size());
            for (ScheduledTask scheduledTask : tasks) {
                Task task = scheduledTask.getTask();
                String taskDescription = task.toString();
                String schedule = getScheduleDescription(task);
                String nextExecution = getNextExecution(task);
                log.info("  - {} | Schedule: {} | Next execution: {}", taskDescription, schedule, nextExecution);
            }
        }
    }

    private String getScheduleDescription(Task task) {
        if (task instanceof FixedDelayTask fixedDelayTask) {
            Duration interval = fixedDelayTask.getIntervalDuration();
            return "fixedDelay=" + interval.toMillis() + "ms";
        } else if (task instanceof FixedRateTask fixedRateTask) {
            Duration interval = fixedRateTask.getIntervalDuration();
            return "fixedRate=" + interval.toMillis() + "ms";
        } else if (task instanceof CronTask cronTask) {
            return "cron=" + cronTask.getExpression();
        }
        return "unknown";
    }

    private String getNextExecution(Task task) {
        Instant now = Instant.now();
        if (task instanceof FixedDelayTask fixedDelayTask) {
            Duration interval = fixedDelayTask.getIntervalDuration();
            return now.plus(interval).toString();
        } else if (task instanceof FixedRateTask fixedRateTask) {
            Duration interval = fixedRateTask.getIntervalDuration();
            return now.plus(interval).toString();
        } else if (task instanceof CronTask cronTask) {
            var nextTime = cronTask.getTrigger().nextExecution(new org.springframework.scheduling.support.SimpleTriggerContext());
            return nextTime != null ? nextTime.toString() : "N/A";
        }
        return "N/A";
    }

    /**
     * Records an audit log entry for the application startup event.
     */
    private void auditApplicationStartup(String hostname) {
        ClusterNode node = clusterNodeRepository.findByHostname(hostname).orElse(null);
        String entityId = node != null ? node.getId().toString() : null;

        auditService.log(new AuditLogEntry(
                "SYSTEM", OperationType.EXECUTE, AuditSection.CLUSTER,
                entityId, "ClusterNode",
                "Application started: hostname=" + hostname));
    }

    private String getHostname() {
        try {
            return InetAddress.getLocalHost().getHostName();
        } catch (UnknownHostException e) {
            log.error("Unable to determine hostname", e);
            return "unknown";
        }
    }
}
