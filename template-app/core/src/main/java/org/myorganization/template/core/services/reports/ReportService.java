package org.myorganization.template.core.services.reports;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import org.myorganization.template.core.domain.archives.Archive;
import org.myorganization.template.core.domain.reports.Report;
import org.myorganization.template.core.domain.reports.ReportCriteria;
import org.myorganization.template.core.domain.reports.ReportParam;
import org.myorganization.template.core.domain.reports.ReportParamOption;
import org.myorganization.template.core.domain.reports.ReportRepository;
import org.myorganization.template.core.services.archives.ArchiveService;
import org.myorganization.template.core.services.base.TemplateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReportService implements TemplateService<Report, ReportCriteria> {

	@Autowired
	private ReportRepository reportRepository;
	
	@Autowired
	private ArchiveService archiveService;

	@Transactional(readOnly = true)
	public List<Report> findAll() {
		return StreamSupport.stream(this.reportRepository.findAll().spliterator(), false).collect(Collectors.toList());
	}
	
	@Transactional(readOnly = true)
	public List<Report> findByCriteria(ReportCriteria criteria) {
		return this.reportRepository.findByCriteria(criteria);
	}
	
	@Transactional(readOnly = true)
	public Long countByCriteria(ReportCriteria criteria) {
		return this.reportRepository.countByCriteria(criteria);
	}
	
	@Transactional
	public Report create(Report report) {
		Archive archive = report.getArchive();
		if (archive.getId() == null) {
			report.setArchive(this.archiveService.create(archive));
		}
		return this.reportRepository.save(report);
	}
	
	@Transactional(readOnly = true)
	public Optional<Report> read(Long id) {
		return this.reportRepository.findById(id);
	}
	
	@Transactional(readOnly = true)
	public List<ReportParam> readParams(Long id) {
		Optional<Report> optional = this.read(id);
		if (optional.isPresent()) {
			Report report = optional.get();
			if (report.getArchive() != null ) {
				List<ReportParam> params;
				
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
						
				return params;
			} else {
				//TODO Archive Not Found Exception....
				return null;
			}
		}
		//TODO Not Found Exception....
		return null;
	}
	
	@Transactional
	public Report update(Long id, Report report) {
		Optional<Report> optional = this.read(id);
		if (optional.isPresent()) {
			Report r = optional.get();
			r.setName(report.getName());
			r.setDescription(report.getDescription());
			Archive archive = report.getArchive();
			if (archive.getId() == null) {
				r.setArchive(this.archiveService.create(archive));
			} else {
				r.setArchive(archive);
			}
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
