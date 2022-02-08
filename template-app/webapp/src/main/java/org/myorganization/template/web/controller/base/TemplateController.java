package org.myorganization.template.web.controller.base;

import java.util.List;

import javax.validation.Valid;

import org.myorganization.template.core.domain.base.Criteria;
import org.myorganization.template.core.domain.base.TemplateEntity;
import org.myorganization.template.core.services.base.TemplateService;
import org.myorganization.template.web.domain.datatables.DataTablesCriteria;
import org.myorganization.template.web.domain.datatables.DataTablesResponse;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

/**
 * Interface defining generic controller operations for basic operations with entities.
 * 
 * @author ijgomez
 *
 * @param <E> Entity
 * @param <C> Criteria
 */
public interface TemplateController<E extends TemplateEntity, C extends Criteria> {

	/**
	 * List all values.
	 * 
	 * @return
	 */
	@GetMapping
	ResponseEntity<List<E>> findAll();

	/**
	 * Search for records that meet specific criteria.
	 * 
	 * @param criteria Object with search criteria.
	 * @return List of values.
	 */
	@PostMapping("/search")
	ResponseEntity<List<E>> findByCriteria(@Valid @RequestBody C criteria);

	/**
	 * Count for records that meet specific criteria.
	 * 
	 * @param criteria Object with search criteria.
	 * @return Count of values.
	 */
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

	/**
	 * Export data to csv file format.
	 * 
	 * @param criteria Object with search criteria.
	 * @return
	 */
	@PostMapping("/export")
	ResponseEntity<Resource> export(@Valid @RequestBody C criteria);

	@PostMapping("/datatables")
	ResponseEntity<DataTablesResponse<E>> datatables(@Valid @RequestBody DataTablesCriteria<C> dtCriteria);

	TemplateService<E, C> getService();

}