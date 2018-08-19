package org.myorganization.template.core.services.reports;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.myorganization.template.core.domain.reports.Report;
import org.myorganization.template.core.domain.reports.ReportCriteria;
import org.myorganization.template.core.domain.reports.ReportRepository;
import org.myorganization.template.core.services.base.TemplateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReportService implements TemplateService<Report, ReportCriteria>{

	@Autowired
	private ReportRepository reportRepository;

	@Transactional(readOnly = true)
	public List<Report> findAll() {
		List<Report> reports = new ArrayList<>();
		for (Report report : this.reportRepository.findAll()) {
			reports.add(report);
		}
		return reports;
	}
	
	@Transactional(readOnly = true)
	public List<Report> findByCriteria(ReportCriteria criteria) {
		List<Report> reports = this.reportRepository.findByCriteria(criteria);
		return reports;
	}
	
	@Transactional(readOnly = true)
	public Long countByCriteria(ReportCriteria criteria) {
		return this.reportRepository.countByCriteria(criteria);
	}
	
	@Transactional
	public Report create(Report report) {
		return this.reportRepository.save(report);
	}
	
	@Transactional(readOnly = true)
	public Report read(Long id) {
		Optional<Report> report = this.reportRepository.findById(id);
		if (report.isPresent()) {
			return report.get();
		} 
		//TODO Not Found Exception....
		return null;
	}
	
	@Transactional
	public Report update(Long id, Report report) {
		Optional<Report> optional = this.reportRepository.findById(id);
		if (optional.isPresent()) {
			Report r = optional.get();
			r.setName(report.getName());
			r.setDescription(report.getDescription());
			return this.reportRepository.save(r);
		} 
		//TODO Not Found Exception....
		return null;
	}
	
	@Transactional
	public Long delete(Long id) {
		this.reportRepository.deleteById(id);
		return id;
	}
}
