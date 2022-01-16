package org.myorganization.template.reports.executor;

import java.io.OutputStream;
import java.sql.Connection;
import java.util.List;
import java.util.Map;

import org.myorganization.template.reports.domain.report.Report;
import org.myorganization.template.reports.domain.reportparam.ReportParam;
import org.myorganization.template.reports.enums.ReportParamEnum;
import org.myorganization.template.reports.exceptions.ReportException;

public interface ReportExecutor {

	List<ReportParam> readParams(Report report) throws ReportException;

	void execute(Report report, Map<ReportParamEnum, Object> parameters, Connection connection, OutputStream outputStream) throws ReportException;

}