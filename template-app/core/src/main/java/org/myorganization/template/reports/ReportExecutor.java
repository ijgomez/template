package org.myorganization.template.reports;

import java.io.OutputStream;
import java.sql.Connection;
import java.util.List;
import java.util.Map;

import org.myorganization.template.reports.domain.Report;
import org.myorganization.template.reports.domain.ReportParam;
import org.myorganization.template.reports.exceptions.ReportException;

public interface ReportExecutor {

	List<ReportParam> readParams(Report report) throws ReportException;

	void execute(Report report, Map<String, Object> parameters, Connection connection, OutputStream outputStream) throws ReportException;

}