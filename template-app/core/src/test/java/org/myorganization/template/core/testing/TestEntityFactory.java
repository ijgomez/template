package org.myorganization.template.core.testing;

import java.util.ArrayList;
import java.util.List;

import org.apache.commons.text.RandomStringGenerator;
import org.myorganization.template.reports.domain.report.Report;
import org.springframework.stereotype.Component;

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
		
		return report;
	}
	
	public Report generateReport() {
		Report report;
		
		report = new Report();
		report.setName(generator.generate(255));
		
		return report;
	}
	
	public String random() {
		return generator.generate(255);
	}
	
}
