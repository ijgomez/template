package org.myorganization.template.reports.executor.jasper;

import java.util.ArrayList;
import java.util.Date;

import org.myorganization.template.reports.domain.reportparam.ReportParam;
import org.myorganization.template.reports.domain.reportparam.ReportParamOption;
import org.myorganization.template.reports.enums.ReportParamEnum;
import org.myorganization.template.reports.enums.ReportParamTypeEnum;

import lombok.extern.slf4j.Slf4j;
import net.sf.jasperreports.engine.JRParameter;

@Slf4j
public class JRReportParamHelper {

	
	public static ReportParam convert(JRParameter parameter, int order) {
		ReportParam param;
		
		param = new ReportParam();
		
		log.debug("Parameter: ");
		log.debug("\t Name:           " + parameter.getName());
		log.debug("\t Descriptor:     " + parameter.getDescription());
		log.debug("\t ValueClassName: " + parameter.getValueClassName());
		log.debug("\t ValueClass:     " + parameter.getValueClass());
		log.debug("\t IsForPrompting: " + parameter.isForPrompting());
		log.debug("\t DefaultValueExpression: " + parameter.getDefaultValueExpression());
		
		
		param.setKey(parameter.getName());
		param.setLabel(parameter.getDescription());
		if (parameter.getDefaultValueExpression() != null) {
			param.setValue(parameter.getDefaultValueExpression().getText());
		}
		param.setRequired(true);
		param.setOrder(order);
		
		if (parameter.getValueClass().equals(String.class)) {
			param.setType(ReportParamTypeEnum.TEXTFIELD.getType());
		
		} else if (parameter.getValueClass().equals(Date.class)) {
			param.setType(ReportParamTypeEnum.TEXTFIELD.getType());
			
		} else {
			param.setType(ReportParamTypeEnum.SELECT.getType());
			param.setOptions(new ArrayList<>());
			param.getOptions().add(new ReportParamOption("option1", "Option 1"));
			param.getOptions().add(new ReportParamOption("option2", "Option 2"));
			param.getOptions().add(new ReportParamOption("option3", "Option 3"));
			param.getOptions().add(new ReportParamOption("option4", "Option 4"));
		}
		
		return param;
	}
	
	public static ReportParam buildParam(ReportParamEnum reportParam, Integer order) {
		ReportParam param;
		ReportParamTypeEnum type;
		param = new ReportParam();
		
		param.setOrder(order);
		param.setKey(reportParam.getKey());
		param.setLabel(reportParam.getDescription());
		param.setRequired(true);
		
		type = reportParam.getType();
		
		param.setType(type.getType());
		if (type.equals(ReportParamTypeEnum.SELECT)) {
			param.setOptions(new ArrayList<>());
			param.getOptions().add(new ReportParamOption("pdf", "PDF"));
			param.getOptions().add(new ReportParamOption("excel", "Excel"));
			param.getOptions().add(new ReportParamOption("html", "HTML"));
		}

		return param;
	}
	
	private JRReportParamHelper() { }
	
}
