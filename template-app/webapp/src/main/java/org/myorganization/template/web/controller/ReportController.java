package org.myorganization.template.web.controller;

import java.net.URI;
import java.util.List;
import java.util.Optional;

import org.apache.commons.lang3.StringUtils;
import org.myorganization.template.core.domain.reports.Report;
import org.myorganization.template.core.domain.reports.ReportCriteria;
import org.myorganization.template.core.helper.FileHelper;
import org.myorganization.template.core.services.reports.ReportService;
import org.myorganization.template.web.domain.datatables.DataTablesResponse;
import org.myorganization.template.web.domain.datatables.criteria.DataTablesCriteria;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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
	private ReportService reportService;

	/**
	 * List all Reports.
	 * @return List.
	 */
	@GetMapping
	public ResponseEntity<List<Report>> findAll() {
		List<Report> reports = reportService.findAll();
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
		
		LOGGER.info("find by criteria: " + criteria);
		
		List<Report> reports = reportService.findByCriteria(criteria);
		if (reports.isEmpty()) {
			return ResponseEntity.noContent().build();
		}
		return ResponseEntity.ok(reports);
	}
	
	@PostMapping("/count")
	public ResponseEntity<Long> countByCriteria(@RequestBody ReportCriteria criteria) {
		
		LOGGER.info("find by criteria: " + criteria);
		
		Long records = reportService.countByCriteria(criteria);

		return ResponseEntity.ok(records);
	}
	
	@PostMapping("/datatables")
	public ResponseEntity<DataTablesResponse<Report>> datatables(@RequestBody DataTablesCriteria dtCriteria) {
		DataTablesResponse<Report> response;
		ReportCriteria reportCriteria;

		LOGGER.info("find by criteria: " + dtCriteria );
		
		reportCriteria = new ReportCriteria();
		if (StringUtils.isNotEmpty(dtCriteria.getSearch().getValue())) {
			reportCriteria.setDescription(dtCriteria.getSearch().getValue());
		}
		reportCriteria.setPageNumber(dtCriteria.getStart());
		reportCriteria.setPageSize(dtCriteria.getLength());
		
		List<Report> reports = reportService.findByCriteria(reportCriteria);
		Long count = reportService.countByCriteria(reportCriteria);
		
		LOGGER.info("Number of Reports: " + reports.size() );
		
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
		report = this.reportService.create(report);
		
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
		Optional<Report> report = this.reportService.read(id);
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
		
		LOGGER.info("update {} - {}", id, report);
		
		report = this.reportService.update(id, report);
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
		
		if (null == this.reportService.delete(id)) {
			return ResponseEntity.notFound().build();
		}

		return ResponseEntity.ok(id);
	}
	
	@GetMapping("/export")
	public ResponseEntity<Resource> export() throws Exception {
		ByteArrayResource resource;
		
		List<Report> data = this.reportService.findByCriteria(new ReportCriteria());
		byte[] csv = FileHelper.toCsvByteArray(data);
		resource = new ByteArrayResource(csv);

		HttpHeaders headers = new HttpHeaders();
		headers.add("Content-disposition", "attachment;filename=export-" + System.currentTimeMillis() + ".csv");
		headers.add("Cache-Control", "no-cache, no-store, must-revalidate");
		headers.add("Pragma", "no-cache");
		headers.add("Expires", "0");

		return ResponseEntity.ok().headers(headers).contentLength(csv.length).contentType(MediaType.parseMediaType("txt/csv")).body(resource);
	}

}
