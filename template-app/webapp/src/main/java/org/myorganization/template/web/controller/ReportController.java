package org.myorganization.template.web.controller;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang3.StringUtils;
import org.myorganization.template.reports.ReportManager;
import org.myorganization.template.reports.domain.report.Report;
import org.myorganization.template.reports.domain.report.ReportCriteria;
import org.myorganization.template.reports.domain.reportengine.ReportEngine;
import org.myorganization.template.reports.domain.reportparam.ReportParam;
import org.myorganization.template.reports.enums.ReportFormatEnum;
import org.myorganization.template.reports.enums.ReportParamEnum;
import org.myorganization.template.reports.exceptions.ReportException;
import org.myorganization.template.reports.exceptions.ReportNotFoundException;
import org.myorganization.template.reports.service.ReportService;
import org.myorganization.template.web.controller.base.TemplateController;
import org.myorganization.template.web.controller.base.TemplateControllerBase;
import org.myorganization.template.web.domain.datatables.DataTablesCriteria;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.slf4j.Slf4j;

/**
 * Report Controller.
 * @author ijgomez
 *
 */
@RestController
@Validated
@RequestMapping("/api/reports")
@Slf4j
public class ReportController extends TemplateControllerBase<Report, ReportCriteria> implements TemplateController<Report, ReportCriteria> {

	@Autowired
	private ReportManager reportManager;

	@Autowired
	public ReportController(ReportService reportService) {
		super(reportService);
	}
	
	@Override
	protected ReportCriteria buildCriteria(DataTablesCriteria<ReportCriteria> dtCriteria) {
		ReportCriteria criteria;
		
		criteria = (dtCriteria.getCriteria() != null) ? dtCriteria.getCriteria() : new ReportCriteria();
		
		if (StringUtils.isNotEmpty(dtCriteria.getParameters().getSearch().getValue())) {
			criteria.setDescription(dtCriteria.getParameters().getSearch().getValue());
		}
		
		return criteria;
	}

	@GetMapping("/{id}/params")
	public ResponseEntity<List<ReportParam>> params(@PathVariable("id") Long id) throws ReportException {
		log.info("params: {}", id);
		
		List<ReportParam> params = this.reportManager.readParams(id);
		
		return ResponseEntity.ok(params);
	}
	
	@GetMapping("/engines")
	public ResponseEntity<List<ReportEngine>> engines() throws ReportException {

		
		List<ReportEngine> params = this.reportManager.engines();
		
		return ResponseEntity.ok(params);
	}
	
	@PostMapping("/{id}/execute")
	public void execute(@PathVariable("id") Long id, @RequestBody Map<ReportParamEnum, Object> params, HttpServletResponse response) throws ReportException {
		log.info("execute: {} {}", id, params);
		
		Optional<Report> data = super.getService().read(id);
		if (!data.isPresent()) {
			throw new ReportNotFoundException("report with id " + id + " not found");
		} else {
			try {
				var report = data.get();
				
				Object value = params.get(ReportParamEnum.EXPORT_TYPE);
				
				if (value == null) {
					throw new ReportException("fail execute report: key " + ReportParamEnum.EXPORT_TYPE.getKey() + " not found");
				}
				
				var format = ReportFormatEnum.findByKey(value.toString());

				response.addHeader("Content-disposition", "attachment;filename=report_" + System.currentTimeMillis() + "." + format.getExtension());
				response.addHeader("Cache-Control", "no-cache, no-store, must-revalidate");
				response.addHeader("Pragma", "no-cache");
				response.addHeader("Expires", "0");
				response.setContentType("application/" + format.getExtension());

				this.reportManager.execute(report, params, response.getOutputStream());
				
				response.flushBuffer();
				
			} catch (ReportException | IOException e) {
				throw new ReportException("fail execute report: " + e.getMessage(), e);
			}
		} 
	}

}
