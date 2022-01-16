package org.myorganization.template.reports.executor.jasper;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.sql.Connection;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.myorganization.template.core.helper.FileHelper;
import org.myorganization.template.reports.domain.report.Report;
import org.myorganization.template.reports.domain.reportparam.ReportParam;
import org.myorganization.template.reports.enums.ReportFormatEnum;
import org.myorganization.template.reports.enums.ReportParamEnum;
import org.myorganization.template.reports.exceptions.ReportException;
import org.myorganization.template.reports.executor.ReportExecutor;
import org.slf4j.MarkerFactory;

import lombok.extern.slf4j.Slf4j;
import net.sf.jasperreports.engine.JRException;
import net.sf.jasperreports.engine.JRParameter;
import net.sf.jasperreports.engine.JasperCompileManager;
import net.sf.jasperreports.engine.JasperExportManager;
import net.sf.jasperreports.engine.JasperFillManager;
import net.sf.jasperreports.engine.JasperPrint;
import net.sf.jasperreports.engine.JasperReport;
import net.sf.jasperreports.engine.design.JasperDesign;
import net.sf.jasperreports.engine.xml.JRXmlLoader;

@Slf4j
public class JRReportExecutor implements ReportExecutor {

	@Override
	public List<ReportParam> readParams(Report report) throws ReportException {
		List<ReportParam> params;
		byte[] decode64;
		var numParam = 0;
		
		params = new ArrayList<>();
		
		params.add(JRReportParamHelper.buildParam(ReportParamEnum.EXPORT_TYPE, 1));

		try {
			JasperDesign jasperDesign;
			JRParameter[] parameters;
			
			decode64 = FileHelper.decode64(report.getArchive().getValue());
			log.debug("decode64 - " + decode64.length);

			numParam = params.size();
			try (InputStream is = new ByteArrayInputStream(decode64)) {
				log.debug("read jasperreport descriptor...");
				jasperDesign = JRXmlLoader.load(is);
				
				parameters = jasperDesign.getParameters();
				for (JRParameter parameter : parameters) {
					if (!parameter.isSystemDefined()) {
						params.add(JRReportParamHelper.convert(parameter, numParam++));
					}
				}
			}

		} catch (JRException | IOException e) {
			throw new ReportException("read params error", e);
		}
		
		return params;
	}

	

	@Override
	public void execute(Report report, Map<ReportParamEnum, Object> parameters, Connection connection, OutputStream outputStream) throws ReportException {
		JasperReport jasperReport;
		JasperPrint jasperPrint;		
		byte[] decode64;
		
		try {
			decode64 = FileHelper.decode64(report.getArchive().getValue());
			log.debug("decode64 - " + decode64.length);

			try (InputStream is = new ByteArrayInputStream(decode64)) {
				log.debug("compile jasperreport descriptor...");
				
				jasperReport = JasperCompileManager.compileReport(is);
				
				log.debug("excute jasper report...");
//				jasperPrint = JasperFillManager.fillReport(jasperReport, parameters.entrySet().stream().collect(Collectors.toMap(
//			            e -> ((ReportParamEnum)e.getKey()).getKey(), Map.Entry::getKey
//			        )), connection);
				jasperPrint = JasperFillManager.fillReport(jasperReport, null, connection);
				
				
				log.debug("generating report...");
				var format = ReportFormatEnum.findByKey(parameters.get(ReportParamEnum.EXPORT_TYPE).toString());
				if (format.equals(ReportFormatEnum.PDF)) {
					JasperExportManager.exportReportToPdfStream(jasperPrint, outputStream);
					log.debug("... end of exportReportToXmlStream");
				} else {
					throw new ReportException("Format " + format.getKey() + " not supported. Not implemented");
				}
				
			}
			
		} catch (JRException | IOException e) {
			log.error(MarkerFactory.getMarker("REPORT"), "Fail to execute jasper report.", e);
			throw new ReportException("Fail to execute jasper report.", e);
		}
	}
}
