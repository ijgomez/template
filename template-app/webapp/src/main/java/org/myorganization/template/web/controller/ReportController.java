package org.myorganization.template.web.controller;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang3.StringUtils;
import org.myorganization.template.reports.ReportManager;
import org.myorganization.template.reports.domain.Report;
import org.myorganization.template.reports.domain.ReportCriteria;
import org.myorganization.template.reports.domain.ReportParam;
import org.myorganization.template.reports.exceptions.ReportException;
import org.myorganization.template.reports.exceptions.ReportNotFoundException;
import org.myorganization.template.reports.service.ReportService;
import org.myorganization.template.web.controller.base.TemplateController;
import org.myorganization.template.web.controller.base.TemplateControllerBase;
import org.myorganization.template.web.domain.datatables.DataTablesResponse;
import org.myorganization.template.web.domain.datatables.criteria.DataTablesCriteria;
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
	
//	@PostMapping("/datatables")
//	public ResponseEntity<DataTablesResponse<Report>> datatables(@RequestBody DataTablesCriteria dtCriteria) {
//		DataTablesResponse<Report> response;
//		ReportCriteria reportCriteria;
//
//		log.info("datatables: {}", dtCriteria );
//		
//		reportCriteria = new ReportCriteria();
//		if (StringUtils.isNotEmpty(dtCriteria.getSearch().getValue())) {
//			reportCriteria.setDescription(dtCriteria.getSearch().getValue());
//		}
//		reportCriteria.setPageNumber(dtCriteria.getStart());
//		reportCriteria.setPageSize(dtCriteria.getLength());
//		reportCriteria.setSortField(dtCriteria.getColumns()[dtCriteria.getOrder()[0].getColumn()].getName());
//		reportCriteria.setSortOrder(dtCriteria.getOrder()[0].getDir());
//		
//		
//		List<Report> reports = super.getService().findByCriteria(reportCriteria);
//		Long count = super.getService().countByCriteria(reportCriteria);
//
//		response = new DataTablesResponse<>();
//		response.setData(reports);
//		response.setDraw(dtCriteria.getDraw());
//		response.setRecordsFiltered(count.intValue());
//		response.setRecordsTotal(count.intValue());
//		
//		return ResponseEntity.ok(response);
//	}
	
	@Override
	protected ReportCriteria buildCriteria(DataTablesCriteria dtCriteria) {
		ReportCriteria criteria;
		
		criteria = new ReportCriteria();
		
		if (StringUtils.isNotEmpty(dtCriteria.getSearch().getValue())) {
			criteria.setDescription(dtCriteria.getSearch().getValue());
		}
		
		return criteria;
	}

	@GetMapping("/{id}/params")
	public ResponseEntity<List<ReportParam>> params(@PathVariable("id") Long id) throws ReportException {
		log.info("params: {}", id);
		
		List<ReportParam> params = this.reportManager.readParams(id);
		
		return ResponseEntity.ok(params);
	}
	
	@PostMapping("/{id}/execute")
	public void execute(@PathVariable("id") Long id, @RequestBody Object params, HttpServletResponse response) throws ReportException {
		log.info("execute: {} {}", id, params);
		
		Optional<Report> data = super.getService().read(id);
		if (data.isPresent()) {
			try {
				var report = data.get();
				
				response.addHeader("Content-disposition", "attachment;filename=report_" + System.currentTimeMillis() + ".pdf");
				response.addHeader("Cache-Control", "no-cache, no-store, must-revalidate");
				response.addHeader("Pragma", "no-cache");
				response.addHeader("Expires", "0");
				response.setContentType("application/pdf");
				
				this.reportManager.execute(report, null, response.getOutputStream());
				
				response.flushBuffer();
				
			} catch (ReportException | IOException e) {
				throw new ReportException("fail execute report", e);
			}
		}
		throw new ReportNotFoundException("report with id " + id + " not found");
		
	}

}
