package org.myorganization.template.web.controller;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.net.URI;
import java.util.List;
import java.util.Optional;

import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.myorganization.template.core.domain.reports.Report;
import org.myorganization.template.core.domain.reports.ReportCriteria;
import org.myorganization.template.core.domain.reports.ReportParam;
import org.myorganization.template.core.helper.FileHelper;
import org.myorganization.template.reports.ReportManager;
import org.myorganization.template.web.domain.datatables.DataTablesResponse;
import org.myorganization.template.web.domain.datatables.criteria.DataTablesCriteria;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

/**
 * Report Controller.
 * @author ijgomez
 *
 */
@RestController
@RequestMapping("/api/reports")
public class ReportController {
	
	private static final Logger LOGGER = LoggerFactory.getLogger(ReportController.class);
	
	@Autowired
	private ReportManager reportManager;

	/**
	 * List all Reports.
	 * @return List.
	 */
	@GetMapping
	public ResponseEntity<List<Report>> findAll() {
		List<Report> reports = reportManager.getReportService().findAll();
		if (reports.isEmpty()) {
			return ResponseEntity.noContent().build();
		}
		return ResponseEntity.ok(reports);
	}
	
	/**
	 * List by criteria.
	 * @return List.
	 */
	@PostMapping("/search")
	public ResponseEntity<List<Report>> findByCriteria(@RequestBody ReportCriteria criteria) {
		
		LOGGER.info("find by criteria: {}", criteria);
		
		List<Report> reports = reportManager.getReportService().findByCriteria(criteria);
		if (reports.isEmpty()) {
			return ResponseEntity.noContent().build();
		}
		return ResponseEntity.ok(reports);
	}
	
	@PostMapping("/count")
	public ResponseEntity<Long> countByCriteria(@RequestBody ReportCriteria criteria) {
		
		LOGGER.info("count by criteria: {}", criteria);
		
		Long records = reportManager.getReportService().countByCriteria(criteria);

		return ResponseEntity.ok(records);
	}
	
	@PostMapping("/datatables")
	public ResponseEntity<DataTablesResponse<Report>> datatables(@RequestBody DataTablesCriteria dtCriteria) {
		DataTablesResponse<Report> response;
		ReportCriteria reportCriteria;

		LOGGER.info("datatables: {}", dtCriteria );
		
		reportCriteria = new ReportCriteria();
		if (StringUtils.isNotEmpty(dtCriteria.getSearch().getValue())) {
			reportCriteria.setDescription(dtCriteria.getSearch().getValue());
		}
		reportCriteria.setPageNumber(dtCriteria.getStart());
		reportCriteria.setPageSize(dtCriteria.getLength());
		reportCriteria.setSortField(dtCriteria.getColumns()[dtCriteria.getOrder()[0].getColumn()].getName());
		reportCriteria.setSortOrder(dtCriteria.getOrder()[0].getDir());
		
		
		List<Report> reports = reportManager.getReportService().findByCriteria(reportCriteria);
		Long count = reportManager.getReportService().countByCriteria(reportCriteria);

		response = new DataTablesResponse<Report>();
		response.setData(reports);
		response.setDraw(dtCriteria.getDraw());
		response.setRecordsFiltered(count.intValue());
		response.setRecordsTotal(count.intValue());
		
		return ResponseEntity.ok(response);
	}
	
	/**
	 * Create a new Report.
	 * @param report New Report.
	 * @return Return of Report.
	 */
	@PostMapping
	public ResponseEntity<Report> create(@RequestBody Report report) {
		report = this.reportManager.getReportService().create(report);
		
		if (report == null) {
			return ResponseEntity.noContent().build();
		}

		URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(report.getId()).toUri();
		return ResponseEntity.created(location).build();
	}
	
	/**
	 * Read a single report.
	 * @param id Id of Report.
	 * @return
	 */
	@GetMapping("/{id}")
	public ResponseEntity<Report> read(@PathVariable("id") Long id) {
		Optional<Report> report = this.reportManager.getReportService().read(id);
		if (report.isPresent()) {
			return ResponseEntity.ok(report.get());
		}
		return ResponseEntity.notFound().build();
	}

	/**
	 * Update report attributes.
	 * @param id Id of Report.
	 * @param report Report with new attributes.
	 * @return
	 */
	@PutMapping("/{id}")
	public ResponseEntity<Report> update(@PathVariable Long id, @RequestBody Report report) {
		
		LOGGER.info("update: {}", report);
		
		report = this.reportManager.getReportService().update(id, report);
		if (null == report) {
			return ResponseEntity.notFound().build();
		}

		return ResponseEntity.ok(report);
	}

	/**
	 * Delete of a Report.
	 * @param id Id of Report.
	 * @return
	 */
	@DeleteMapping("/{id}")
	public ResponseEntity<Long> delete(@PathVariable("id") Long id) {
		
		LOGGER.info("delete: {}", id);
		
		if (null == this.reportManager.getReportService().delete(id)) {
			return ResponseEntity.notFound().build();
		}

		return ResponseEntity.ok(id);
	}
	
	@GetMapping("/{id}/params")
	public ResponseEntity<List<ReportParam>> params(@PathVariable("id") Long id) throws Exception {
		LOGGER.info("params: {}", id);
		
		List<ReportParam> params = this.reportManager.readParams(id);
		
		return ResponseEntity.ok(params);
	}
	
	@GetMapping("/export")
	public void  export(HttpServletResponse response) throws Exception {
		LOGGER.info("export");
		
		List<Report> data = this.reportManager.getReportService().findByCriteria(new ReportCriteria());
		
		response.addHeader("Content-disposition", "attachment;filename=export_" + System.currentTimeMillis() + ".csv");
		response.addHeader("Cache-Control", "no-cache, no-store, must-revalidate");
		response.addHeader("Pragma", "no-cache");
		response.addHeader("Expires", "0");
		response.setContentType("application/vnd.ms-excel");
		try (InputStream is = new ByteArrayInputStream(FileHelper.toCsvByteArray(data))) {
			IOUtils.copy(is, response.getOutputStream());
		}
		response.flushBuffer();
	}
	
	@PostMapping("/{id}/execute")
	public ResponseEntity<Resource> execute(@PathVariable("id") Long id, @RequestBody Object params) throws Exception {
		LOGGER.info("execute: {} {}", id, params);
		this.reportManager.execute(id);
		
		return null;
	}

}
