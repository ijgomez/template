package org.myorganization.template.web.controller;

import java.net.URI;
import java.util.List;
import java.util.Optional;

import org.apache.commons.lang3.StringUtils;
import org.myorganization.template.core.domain.archives.Archive;
import org.myorganization.template.core.domain.archives.ArchiveCriteria;
import org.myorganization.template.core.helper.FileHelper;
import org.myorganization.template.core.services.archives.ArchiveService;
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
 * Archive Controller.
 * @author ijgomez
 *
 */
@RestController
@RequestMapping("/api/archives")
public class ArchiveController {
	
	private static final Logger LOGGER = LoggerFactory.getLogger(ArchiveController.class);
	
	@Autowired
	private ArchiveService archiveService;

	/**
	 * List all Archives.
	 * @return List.
	 */
	@GetMapping
	public ResponseEntity<List<Archive>> findAll() {
		List<Archive> archives = archiveService.findAll();
		if (archives.isEmpty()) {
			return ResponseEntity.noContent().build();
		}
		return ResponseEntity.ok(archives);
	}
	
	/**
	 * List by criteria.
	 * @return List.
	 */
	@PostMapping("/search")
	public ResponseEntity<List<Archive>> findByCriteria(@RequestBody ArchiveCriteria criteria) {
		
		LOGGER.info("find by criteria: {}", criteria);
		
		List<Archive> archives = archiveService.findByCriteria(criteria);
		if (archives.isEmpty()) {
			return ResponseEntity.noContent().build();
		}
		return ResponseEntity.ok(archives);
	}
	
	@PostMapping("/count")
	public ResponseEntity<Long> countByCriteria(@RequestBody ArchiveCriteria criteria) {
		
		LOGGER.info("count by criteria: {}", criteria);
		
		Long records = archiveService.countByCriteria(criteria);

		return ResponseEntity.ok(records);
	}
	
	@PostMapping("/datatables")
	public ResponseEntity<DataTablesResponse<Archive>> datatables(@RequestBody DataTablesCriteria dtCriteria) {
		DataTablesResponse<Archive> response;
		ArchiveCriteria archiveCriteria;

		LOGGER.info("datatables: {}", dtCriteria );
		
		archiveCriteria = new ArchiveCriteria();
		if (StringUtils.isNotEmpty(dtCriteria.getSearch().getValue())) {
			archiveCriteria.setFilename(dtCriteria.getSearch().getValue());
		}
		archiveCriteria.setPageNumber(dtCriteria.getStart());
		archiveCriteria.setPageSize(dtCriteria.getLength());
		archiveCriteria.setSortField(dtCriteria.getColumns()[dtCriteria.getOrder()[0].getColumn()].getName());
		archiveCriteria.setSortOrder(dtCriteria.getOrder()[0].getDir());
		
		
		List<Archive> archives = archiveService.findByCriteria(archiveCriteria);
		Long count = archiveService.countByCriteria(archiveCriteria);

		response = new DataTablesResponse<Archive>();
		response.setData(archives);
		response.setDraw(dtCriteria.getDraw());
		response.setRecordsFiltered(count.intValue());
		response.setRecordsTotal(count.intValue());
		
		return ResponseEntity.ok(response);
	}
	
	/**
	 * Create a new Archive.
	 * @param archive New Archive.
	 * @return Return of Archive.
	 */
	@PostMapping
	public ResponseEntity<Archive> create(@RequestBody Archive archive) {
		archive = this.archiveService.create(archive);
		
		if (archive == null) {
			return ResponseEntity.noContent().build();
		}

		URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(archive.getId()).toUri();
		return ResponseEntity.created(location).build();
	}
	
	/**
	 * Read a single archive.
	 * @param id Id of Archive.
	 * @return
	 */
	@GetMapping("/{id}")
	public ResponseEntity<Archive> read(@PathVariable("id") Long id) {
		Optional<Archive> archive = this.archiveService.read(id);
		if (archive.isPresent()) {
			return ResponseEntity.ok(archive.get());
		}
		return ResponseEntity.notFound().build();
	}

	/**
	 * Update archive attributes.
	 * @param id Id of Archive.
	 * @param archive Archive with new attributes.
	 * @return
	 */
	@PutMapping("/{id}")
	public ResponseEntity<Archive> update(@PathVariable Long id, @RequestBody Archive archive) {
		
		LOGGER.info("update: {}", archive);
		
		archive = this.archiveService.update(id, archive);
		if (null == archive) {
			return ResponseEntity.notFound().build();
		}

		return ResponseEntity.ok(archive);
	}

	/**
	 * Delete of a Archive.
	 * @param id Id of Archive.
	 * @return
	 */
	@DeleteMapping("/{id}")
	public ResponseEntity<Long> delete(@PathVariable("id") Long id) {
		
		LOGGER.info("delete: {}", id);
		
		if (null == this.archiveService.delete(id)) {
			return ResponseEntity.notFound().build();
		}

		return ResponseEntity.ok(id);
	}
	
	@GetMapping("/export")
	public ResponseEntity<Resource> export() throws Exception {
		ByteArrayResource resource;
		
		List<Archive> data = this.archiveService.findByCriteria(new ArchiveCriteria());
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
