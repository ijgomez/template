package org.myorganization.template.reports;

import java.io.OutputStream;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import javax.sql.DataSource;

import org.myorganization.template.reports.domain.Report;
import org.myorganization.template.reports.domain.ReportParam;
import org.myorganization.template.reports.exceptions.ReportException;
import org.myorganization.template.reports.exceptions.ReportNotFoundException;
import org.myorganization.template.reports.jasper.JRReportExecutor;
import org.myorganization.template.reports.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class ReportManager {
	
	@Autowired
	private ReportService reportService;
	
	@Autowired
	private DataSource dataSource;

	@Transactional(readOnly = true)
	public List<ReportParam> readParams(Long id) throws ReportException {
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
		throw new ReportNotFoundException("report with id " + id + " not found");
	}
	
	private ReportExecutor createExecutor(Report report) {
		log.debug("Jasper Report Executor...");
		log.debug("Filetype: {}", report.getArchive().getFiletype());
		return new JRReportExecutor();
	}

	public void execute(Report report, Map<String, Object> params, OutputStream outputStream) throws ReportException {
		ReportExecutor executor;
		
		try {
			if (report.getArchive() != null ) {
				executor = this.createExecutor(report);
				// TODO Auto-generated method stub
				executor.execute(report, params, this.dataSource.getConnection(), outputStream);
			} else {
				//TODO Archive Not Found Exception....
			}
		} catch (SQLException e) {
			throw new ReportException("Fail to execute report.", e);
		}
	}
	
}
