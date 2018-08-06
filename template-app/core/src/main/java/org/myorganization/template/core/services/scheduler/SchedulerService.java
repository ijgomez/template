package org.myorganization.template.core.services.scheduler;

import org.springframework.stereotype.Service;

@Service
public class SchedulerService {
//	
//	private static final Logger LOGGER = LoggerFactory.getLogger(SchedulerService.class);
//
//	@Autowired
//	private ProcessService processService;
//	
//	@Autowired
//	private SchedulerFactoryBean schedulerFactoryBean;
//	
//	@Autowired
//	private TaskScheduler taskScheduler;
	
//	@PostConstruct
//	public void startScheduledTasks() {
//		
//		List<Process> processes = this.processService.findAll();
//		
//		for (Process process : processes) {
//			try {
//				this.scheduled(process);
//			} catch (SchedulerException e) {
//				// TODO Auto-generated catch block
//				e.printStackTrace();
//			}
//		}
//		
//	}
	
//	public void scheduled(Process process) throws SchedulerException {
//		LOGGER.debug("------------------------------------" + process);
//		
//		this.taskScheduler.schedule(new DummyProcess(), new CronTrigger("0/5 * * * * ?"));
//		
////		JobDetail job = JobBuilder.newJob(DummyProcess.class).withIdentity("dummyJobName", "group1").build();
////		
////		Trigger trigger = TriggerBuilder
////				.newTrigger()
////				.withIdentity("dummyTriggerName", "group1")
////				.withSchedule(
////					CronScheduleBuilder.cronSchedule("0/5 * * * * ?"))
////				.build();
////		
////		this.schedulerFactoryBean.getScheduler().scheduleJob(job, trigger);
//		
//		// TODO Auto-generated method stub
//	}

}
