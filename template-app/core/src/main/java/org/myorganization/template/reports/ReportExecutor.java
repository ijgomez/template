package org.myorganization.template.reports;

import java.sql.Connection;
import java.util.List;
import java.util.Map;

import org.myorganization.template.core.domain.reports.Report;
import org.myorganization.template.core.domain.reports.ReportParam;

public interface ReportExecutor {

	List<ReportParam> readParams(Report report);

	void execute(Report report, Map<String, Object> parameters, Connection connection);

}