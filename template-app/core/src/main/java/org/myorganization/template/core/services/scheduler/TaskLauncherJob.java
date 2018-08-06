package org.myorganization.template.core.services.scheduler;

import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class TaskLauncherJob implements Job {

	private static final Logger LOGGER = LoggerFactory.getLogger(TaskLauncherJob.class);

	@Override
	public void execute(JobExecutionContext context) throws JobExecutionException {
		// TODO Auto-generated method stub
		LOGGER.debug("Dummy");
	}

}
