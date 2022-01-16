package org.myorganization.template.reports.executor.html;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.sql.Connection;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.myorganization.template.core.helper.FileHelper;
import org.myorganization.template.reports.domain.report.Report;
import org.myorganization.template.reports.domain.reportparam.ReportParam;
import org.myorganization.template.reports.enums.ReportParamEnum;
import org.myorganization.template.reports.exceptions.ReportException;
import org.myorganization.template.reports.executor.ReportExecutor;
import org.myorganization.template.reports.executor.jasper.JRReportParamHelper;
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
public class DefaultReportExecutor implements ReportExecutor {

	@Override
	public List<ReportParam> readParams(Report report) throws ReportException {
		List<ReportParam> params;
		ReportParam param;
		byte[] decode64;
		int numParam = 0;
		
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
		
		
		
		
		
		//TODO Read Archive....
		
		
		
//		ReportParam param = new ReportParam();
//		

//		
//		param = new ReportParam();
//		param.setType("INPUT");
//		param.setKey("reportParam1");
//		param.setLabel("Parameter 1");
//		param.setValue("Default Value");
//		param.setRequired(true);
//		param.setOrder(1L);
//		
//		params.add(param);
//		
//		param = new ReportParam();
//		param.setType("EMAIL");
//		param.setKey("reportParam2");
//		param.setLabel("Parameter 2 (e-mail)");
//		param.setOrder(2L);
//		
//		params.add(param);
//		
//		param = new ReportParam();
//		param.setType("INPUT");
//		param.setKey("reportParam4");
//		param.setLabel("Parameter 4");
//		param.setOrder(4L);
//		
//		params.add(param);
				
		return params;
	}

	

	@Override
	public void execute(Report report, Map<ReportParamEnum, Object> parameters, Connection connection, OutputStream outputStream) throws ReportException {
//		JasperDesign jasperDesign;
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
				jasperPrint = JasperFillManager.fillReport(jasperReport, null, connection);
				
				log.debug("generating report...");
				JasperExportManager.exportReportToPdfStream(jasperPrint, outputStream);
				log.debug("... end of exportReportToXmlStream");
			}
			
		} catch (JRException | IOException e) {
			log.error(MarkerFactory.getMarker("REPORT"), "Fail to execute jasper report.", e);
			throw new ReportException("Fail to execute jasper report.", e);
		}
	}
}
