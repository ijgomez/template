package org.myorganization.template.core.services.reports;

import java.util.List;

import org.myorganization.template.core.domain.reports.Report;
import org.myorganization.template.core.domain.reports.ReportCriteria;
import org.myorganization.template.core.domain.reports.ReportRepository;
import org.myorganization.template.core.services.archives.ArchiveService;
import org.myorganization.template.core.services.base.TemplateService;
import org.myorganization.template.core.services.base.TemplateServiceBase;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReportService extends TemplateServiceBase<Report, ReportCriteria>  implements TemplateService<Report, ReportCriteria> {

	@Autowired
	private ArchiveService archiveService;

	@Autowired
	public ReportService(ReportRepository reportRepository) {
		super(reportRepository);
	}

	@Transactional(readOnly = true)
	public List<Report> findByCriteria(ReportCriteria criteria) {
		return ((ReportRepository) super.getRepository()).findByCriteria(criteria);
	}
	
	@Transactional(readOnly = true)
	public Long countByCriteria(ReportCriteria criteria) {
		return ((ReportRepository) super.getRepository()).countByCriteria(criteria);
	}
	
	@Override
	@Transactional
	public Report create(Report report) {
		var archive = report.getArchive();
		if (archive.getId() == null) {
			report.setArchive(this.archiveService.create(archive));
		}
		return super.create(report);
	}

	@Transactional
	public Report update(Long id, Report report) {
		return this.read(id).map(r -> {
			
			r.setName(report.getName());
			r.setDescription(report.getDescription());
			
			var archive = report.getArchive();
			if (archive.getId() == null) {
				r.setArchive(this.archiveService.create(archive));
			} else {
				r.setArchive(archive);
			}
			
			return this.getRepository().save(r);
		}).orElseGet(() -> null);

	}

}
