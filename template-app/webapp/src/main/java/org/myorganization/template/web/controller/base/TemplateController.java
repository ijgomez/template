package org.myorganization.template.web.controller.base;

import java.util.List;

import javax.validation.Valid;

import org.myorganization.template.core.domain.base.Criteria;
import org.myorganization.template.core.domain.base.TemplateEntity;
import org.myorganization.template.core.services.base.TemplateService;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

public interface TemplateController<E extends TemplateEntity, C extends Criteria> {

	@GetMapping
	ResponseEntity<List<E>> findAll();

	@PostMapping("/search")
	ResponseEntity<List<E>> findByCriteria(@Valid @RequestBody C criteria);

	@PostMapping("/count")
	ResponseEntity<Long> countByCriteria(@Valid @RequestBody  C criteria);

	@PostMapping
	ResponseEntity<E> create(@Valid @RequestBody E entity);

	@GetMapping("/{id}")
	ResponseEntity<E> read(@PathVariable Long id);

	@PutMapping("/{id}")
	ResponseEntity<E> update(@PathVariable Long id, @Valid @RequestBody E entity);

	@DeleteMapping("/{id}")
	ResponseEntity<Long> delete(@PathVariable Long id);

	@PostMapping("/export")
	ResponseEntity<Resource> export(@Valid @RequestBody C criteria);

	TemplateService<E, C> getService();

}