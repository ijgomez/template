package org.myorganization.template.reports;

import java.util.List;

import org.myorganization.template.core.domain.reports.Report;
import org.myorganization.template.core.domain.reports.ReportParam;

public interface ReportExecutor {

	List<ReportParam> readParams(Report report);

}