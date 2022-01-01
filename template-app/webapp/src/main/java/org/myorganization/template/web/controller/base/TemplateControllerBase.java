package org.myorganization.template.web.controller.base;

import java.util.List;
import java.util.Optional;

import javax.validation.Valid;

import org.myorganization.template.core.domain.base.Criteria;
import org.myorganization.template.core.domain.base.TemplateEntityBase;
import org.myorganization.template.core.helper.FileHelper;
import org.myorganization.template.core.services.base.TemplateService;
import org.myorganization.template.web.domain.datatables.DataTablesResponse;
import org.myorganization.template.web.domain.datatables.criteria.DataTablesCriteria;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public abstract class TemplateControllerBase<E extends TemplateEntityBase, C extends Criteria> implements TemplateController<E, C> {

	private TemplateService<E, C> service;

	/**
	 * new instance.
	 * 
	 * @param service Service.
	 */
	protected TemplateControllerBase(TemplateService<E, C> service) {
		super();
		this.service = service;
	}
	
	@Override
	public ResponseEntity<List<E>> findAll() {
		List<E> data = this.service.findAll();
		if (data.isEmpty()) {
			return ResponseEntity.noContent().build();
		}
		return ResponseEntity.ok(data);
	}
	
	@Override
	public ResponseEntity<List<E>> findByCriteria(@Valid @RequestBody C criteria) {
		
		log.debug("find by criteria: {}", criteria);
		
		if (criteria == null) {
			return ResponseEntity.badRequest().build();
		} 
		
		List<E> data = this.service.findByCriteria(criteria);
		if (data.isEmpty()) {
			return ResponseEntity.noContent().build();
		}
		return ResponseEntity.ok(data);
	}
	
	@Override
	public ResponseEntity<Long> countByCriteria(@Valid @RequestBody C criteria) {
		
		log.debug("count by criteria: {}", criteria);

		if (criteria == null) {
			return ResponseEntity.badRequest().build();
		} 
		
		Long records = this.service.countByCriteria(criteria);

		return ResponseEntity.ok(records);
	}
	
	@Override
	public ResponseEntity<E> create(@Valid @RequestBody E entity) {
		log.debug("create {}", entity);
		
		if (entity == null) {
			return ResponseEntity.badRequest().build();
		} 
		
		entity = this.service.create(entity);
		
		if (entity == null) {
			return ResponseEntity.noContent().build();
		}

		return ResponseEntity.created(ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(entity.getId()).toUri()).build();
	}
	
	@Override
	public ResponseEntity<E> read(@PathVariable("id") Long id) {
		log.debug("read {}", id);
		
		if (id == null) {
			return ResponseEntity.badRequest().build();
		} 
		
		Optional<E> data = this.service.read(id);
		if (data.isPresent()) {
			return ResponseEntity.ok(data.get());
		}
		return ResponseEntity.notFound().build();
	}
	
	@Override
	public ResponseEntity<E> update(@PathVariable Long id, @Valid @RequestBody E entity) {
		
		log.debug("update {} - {}", id, entity);
		
		if (entity == null || id == null) {
			return ResponseEntity.badRequest().build();
		} 
		
		entity = this.service.update(id, entity);
		if (null == entity) {
			return ResponseEntity.notFound().build();
		}

		return ResponseEntity.ok(entity);
	}
	
	@Override
	public ResponseEntity<Long> delete(@PathVariable("id") Long id) {
		
		log.debug("delete {}", id);
		
		if (id == null) {
			return ResponseEntity.badRequest().build();
		} 
		
		if (null == this.service.delete(id)) {
			return ResponseEntity.notFound().build();
		}

		return ResponseEntity.ok(id);
	}
	
	@Override
	public ResponseEntity<Resource> export(@Valid @RequestBody C criteria) {
		ByteArrayResource resource;
		
		try {
			log.debug("export by criteria: {}", criteria);
			
			if (criteria == null) {
				return ResponseEntity.badRequest().build();
			} 
			
			List<E> data = this.service.findByCriteria(criteria);
			byte[] csv = FileHelper.toCsvByteArray(data);
			resource = new ByteArrayResource(csv);

			var headers = new HttpHeaders();
			headers.add("Content-disposition", "attachment;filename=export-" + System.currentTimeMillis() + ".csv");
			headers.add("Cache-Control", "no-cache, no-store, must-revalidate");
			headers.add("Pragma", "no-cache");
			headers.add("Expires", "0");

			return ResponseEntity.ok().headers(headers).contentLength(csv.length).contentType(MediaType.parseMediaType("txt/csv")).body(resource);
		
		} catch (Exception e) {
			log.error("export by criteria: {}", e.getMessage(), e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}
	
	@Override
	public ResponseEntity<DataTablesResponse<E>> datatables(@Valid @RequestBody DataTablesCriteria dtCriteria) {
		DataTablesResponse<E> response;
		C criteria;

		log.debug("datatables: {}", dtCriteria );
		
		criteria = this.buildCriteria(dtCriteria);

		criteria.setPageNumber(dtCriteria.getStart());
		criteria.setPageSize(dtCriteria.getLength());
		if (dtCriteria.getOrder() != null && dtCriteria.getOrder().length > 0) {
			criteria.setSortField(dtCriteria.getColumns()[dtCriteria.getOrder()[0].getColumn()].getData());
			criteria.setSortOrder(dtCriteria.getOrder()[0].getDir());
		}

		List<E> data = this.getService().findByCriteria(criteria);
		Long count = this.getService().countByCriteria(criteria);

		response = new DataTablesResponse<>();
		response.setData(data);
		response.setDraw(dtCriteria.getDraw());
		response.setRecordsFiltered(count.intValue());
		response.setRecordsTotal(count.intValue());
		
		return ResponseEntity.ok(response);
	}
	
	protected abstract C buildCriteria(DataTablesCriteria dtCriteria);

	@Override
	public TemplateService<E, C> getService() {
		return service;
	}
	
	protected UserDetails getUserDetails() {
		return (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
	}
}
