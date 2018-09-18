package org.myorganization.template.reports;

import java.util.List;
import java.util.Optional;

import org.myorganization.template.core.domain.reports.Report;
import org.myorganization.template.core.domain.reports.ReportParam;
import org.myorganization.template.core.services.reports.ReportService;
import org.myorganization.template.reports.jasper.JRReportExecutor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class ReportManager {
	
	@Autowired
	private ReportService reportService;
	
	public ReportService getReportService() {
		return reportService;
	}
	
	@Transactional(readOnly = true)
	public List<ReportParam> readParams(Long id) {
		ReportExecutor executor;
		Optional<Report> optional;
		
		optional = this.reportService.read(id);
		if (optional.isPresent()) {
			Report report = optional.get();
			if (report.getArchive() != null ) {
				executor = this.createExecutor(report);
				return executor.readParams(report);
			} else {
				//TODO Archive Not Found Exception....
				return null;
			}
		}
		//TODO Not Found Exception....
		return null;
	}
	
	private ReportExecutor createExecutor(Report report) {
		log.debug("Jasper Report Executor...");
		return new JRReportExecutor();
	}

	public void execute(Long id) {
		// TODO Auto-generated method stub
		
	}
	
}
