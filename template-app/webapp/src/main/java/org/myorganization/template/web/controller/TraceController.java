package org.myorganization.template.web.controller;

import java.net.URI;
import java.util.List;

import org.myorganization.template.core.domain.system.traces.Trace;
import org.myorganization.template.core.domain.system.traces.TraceCriteria;
import org.myorganization.template.core.services.system.TraceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
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

@RestController
@RequestMapping("/api/traces")
public class TraceController {
	
	private static final Logger LOGGER = LoggerFactory.getLogger(ReportController.class);
	
	@Autowired
	private TraceService traceService;
	
	@GetMapping
	public ResponseEntity<List<Trace>> findAll() {
		List<Trace> traces = traceService.findAll();
		if (traces.isEmpty()) {
			return ResponseEntity.noContent().build();
		}
		return ResponseEntity.ok(traces);
	}

	@PostMapping("/search")
	public ResponseEntity<List<Trace>> findByCriteria(@RequestBody TraceCriteria criteria) {
		
		LOGGER.info("find by criteria: " + criteria);
		
		List<Trace> traces = traceService.findByCriteria(criteria);
		if (traces.isEmpty()) {
			return ResponseEntity.noContent().build();
		}
		return ResponseEntity.ok(traces);
	}
	
	@PostMapping("/count")
	public ResponseEntity<Long> countByCriteria(@RequestBody TraceCriteria criteria) {
		
		LOGGER.info("find by criteria: " + criteria);
		
		Long records = traceService.countByCriteria(criteria);

		return ResponseEntity.ok(records);
	}
	
	@PostMapping
	public ResponseEntity<Trace> create(@RequestBody Trace trace) {
		trace = traceService.create(trace);
		
		if (trace == null) {
			return ResponseEntity.noContent().build();
		}

		URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(trace.getId()).toUri();
		return ResponseEntity.created(location).build();
	}

	@GetMapping("/{id}")
	public ResponseEntity<Trace> read(@PathVariable("id") Long id) {
		Trace trace = this.traceService.read(id);
		if (trace == null) {
			return ResponseEntity.notFound().build();
		}

		return ResponseEntity.ok(trace);
	}
	
	@PutMapping("/{id}")
	public ResponseEntity<Trace> update(@PathVariable Long id, @RequestBody Trace trace) {
		
		LOGGER.info("update {} - {}", id, trace);
		
		trace = this.traceService.update(id, trace);
		if (null == trace) {
			return ResponseEntity.notFound().build();
		}

		return ResponseEntity.ok(trace);
	}
	
	@DeleteMapping("/{id}")
	public ResponseEntity<Long> delete(@PathVariable("id") Long id) {
		
		if (null == this.traceService.delete(id)) {
			return ResponseEntity.notFound().build();
		}

		return ResponseEntity.ok(id);
	}
}
