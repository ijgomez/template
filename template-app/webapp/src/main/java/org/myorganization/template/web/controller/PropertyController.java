package org.myorganization.template.web.controller;

import java.net.URI;
import java.util.List;

import org.myorganization.template.core.domain.system.properties.Property;
import org.myorganization.template.core.domain.system.properties.PropertyCriteria;
import org.myorganization.template.core.services.system.PropertyService;
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
@RequestMapping("/api/properties")
public class PropertyController {
	
	private static final Logger LOGGER = LoggerFactory.getLogger(ReportController.class);
	
	@Autowired
	private PropertyService propertyService;
	
	@GetMapping
	public ResponseEntity<List<Property>> findAll() {
		List<Property> properties = propertyService.findAll();
		if (properties.isEmpty()) {
			return ResponseEntity.noContent().build();
		}
		return ResponseEntity.ok(properties);
	}

	@PostMapping("/search")
	public ResponseEntity<List<Property>> findByCriteria(@RequestBody PropertyCriteria criteria) {
		
		LOGGER.info("find by criteria: " + criteria);
		
		List<Property> properties = propertyService.findByCriteria(criteria);
		if (properties.isEmpty()) {
			return ResponseEntity.noContent().build();
		}
		return ResponseEntity.ok(properties);
	}
	
	@PostMapping("/count")
	public ResponseEntity<Long> countByCriteria(@RequestBody PropertyCriteria criteria) {
		
		LOGGER.info("find by criteria: " + criteria);
		
		Long records = propertyService.countByCriteria(criteria);

		return ResponseEntity.ok(records);
	}
	
	@PostMapping
	public ResponseEntity<Property> create(@RequestBody Property property) {
		property = propertyService.create(property);
		
		if (property == null) {
			return ResponseEntity.noContent().build();
		}

		URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(property.getId()).toUri();
		return ResponseEntity.created(location).build();
	}

	@GetMapping("/{id}")
	public ResponseEntity<Property> read(@PathVariable("id") Long id) {
		Property property = this.propertyService.read(id);
		if (property == null) {
			return ResponseEntity.notFound().build();
		}

		return ResponseEntity.ok(property);
	}
	
	@PutMapping("/{id}")
	public ResponseEntity<Property> update(@PathVariable Long id, @RequestBody Property property) {
		
		LOGGER.info("update {} - {}", id, property);
		
		property = this.propertyService.update(id, property);
		if (null == property) {
			return ResponseEntity.notFound().build();
		}

		return ResponseEntity.ok(property);
	}
	
	@DeleteMapping("/{id}")
	public ResponseEntity<Long> delete(@PathVariable("id") Long id) {
		
		if (null == this.propertyService.delete(id)) {
			return ResponseEntity.notFound().build();
		}

		return ResponseEntity.ok(id);
	}
}
