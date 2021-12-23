package org.myorganization.template.web.testing;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import org.apache.commons.text.RandomStringGenerator;
import org.myorganization.template.reports.domain.Report;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.annotation.JsonInclude.Include;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class TestEntityFactory {

	private RandomStringGenerator generator;
	
	public TestEntityFactory() {
		generator = new RandomStringGenerator.Builder().withinRange('a', 'z').build();
	}
	
	public List<Report> generateReports(long num) {
		List<Report> reports;
		Report report;
		
		reports = new ArrayList<>();
		for (long id = 0; id < num; id++) {
			report = generateReport(id);
			
			reports.add(report);
		}
		return reports;
	}
	
	public Report generateReport(Long id) {
		Report report;
		
		report = this.generateReport();
		report.setId(id);
		report.setName(generator.generate(256));
		
		return report;
	}
	
	public Report generateReport() {
		Report report;
		
		report = new Report();
		report.setId(Long.MAX_VALUE);
		report.setName(generator.generate(256));
		
		return report;
	}
	
	public String random() {
		return generator.generate(256);
	}
	
    public byte[] convertObjectToJsonBytes(Object object, Include include) throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        mapper.setSerializationInclusion(include);
        return mapper.writeValueAsBytes(object);
    }

}
