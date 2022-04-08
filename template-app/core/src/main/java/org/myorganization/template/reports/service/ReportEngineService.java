package org.myorganization.template.reports.service;

import java.util.List;

import org.myorganization.template.core.services.base.TemplateServiceBase;
import org.myorganization.template.reports.domain.reportengine.ReportEngine;
import org.myorganization.template.reports.domain.reportengine.ReportEngineCriteria;
import org.myorganization.template.reports.domain.reportengine.ReportEngineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReportEngineService extends TemplateServiceBase<ReportEngine, ReportEngineCriteria> {

	@Autowired
	public ReportEngineService(ReportEngineRepository reportEngineRepository) {
		super(reportEngineRepository);
	}

	@Transactional(readOnly = true)
	public List<ReportEngine> findByCriteria(ReportEngineCriteria criteria) {
		return ((ReportEngineRepository) super.getRepository()).findByCriteria(criteria);
	}
	
	@Transactional(readOnly = true)
	public Long countByCriteria(ReportEngineCriteria criteria) {
		return ((ReportEngineRepository) super.getRepository()).countByCriteria(criteria);
	}

	@Transactional
	public ReportEngine update(Long id, ReportEngine report) {
		return this.read(id).map(re -> {
			
			re.setType(report.getType());
			re.setDescription(report.getDescription());

			return this.getRepository().save(re);
		}).orElseGet(() -> null);

	}

}
