package org.myorganization.template.reports;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

import org.myorganization.template.core.domain.archives.Archive;
import org.myorganization.template.core.domain.reports.ReportParam;
import org.myorganization.template.core.domain.reports.ReportParamOption;
import org.myorganization.template.core.helper.FileHelper;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;
import net.sf.jasperreports.engine.JRException;
import net.sf.jasperreports.engine.JRParameter;
import net.sf.jasperreports.engine.design.JasperDesign;
import net.sf.jasperreports.engine.xml.JRXmlLoader;

@Component
@Slf4j
public class ReportManager {

	public List<ReportParam> readParams(Archive archive) {
		List<ReportParam> params;
		
		byte[] decode64;
		try {
			decode64 = FileHelper.decode64(archive.getValue());
			log.debug("decode64 - " + decode64.length);
			
			JasperDesign jasperDesign;
			JRParameter[] parameters;
			try (InputStream is = new ByteArrayInputStream(decode64)) {
				log.debug("read jasperreport descriptor...");
				jasperDesign = JRXmlLoader.load(is);
				
				parameters = jasperDesign.getParameters();
				for (JRParameter parameter : parameters) {
					if (!parameter.isSystemDefined()) {
						
						log.debug("Parameter: ");
						log.debug("\t Name:           " + parameter.getName());
						log.debug("\t Descriptor:     " + parameter.getDescription());
						log.debug("\t ValueClassName: " + parameter.getValueClassName());
						log.debug("\t ValueClass:     " + parameter.getValueClass());
						log.debug("\t IsForPrompting: " + parameter.isForPrompting());
						log.debug("\t DefaultValueExpression: " + parameter.getDefaultValueExpression());
						
						
						
					}

				}
			}
		} catch (JRException | IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		
		
		
		
		//TODO Read Archive....
		
		params = new ArrayList<>();
		
		ReportParam param = new ReportParam();
		
		param.setType("SELECT");
		param.setKey("reportParam3");
		param.setLabel("Parameter 3");
		param.setOptions(new ArrayList<>());
		param.getOptions().add(new ReportParamOption("option1", "Option 1"));
		param.getOptions().add(new ReportParamOption("option2", "Option 2"));
		param.getOptions().add(new ReportParamOption("option3", "Option 3"));
		param.getOptions().add(new ReportParamOption("option4", "Option 4"));
		param.setOrder(3L);
		
		params.add(param);
		
		param = new ReportParam();
		param.setType("INPUT");
		param.setKey("reportParam1");
		param.setLabel("Parameter 1");
		param.setValue("Default Value");
		param.setRequired(true);
		param.setOrder(1L);
		
		params.add(param);
		
		param = new ReportParam();
		param.setType("EMAIL");
		param.setKey("reportParam2");
		param.setLabel("Parameter 2 (e-mail)");
		param.setOrder(2L);
		
		params.add(param);
		
		param = new ReportParam();
		param.setType("INPUT");
		param.setKey("reportParam4");
		param.setLabel("Parameter 4");
		param.setOrder(4L);
		
		params.add(param);
				
		return params;
	}
	
}
