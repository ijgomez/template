package org.myorganization.template.core.services.base;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import org.myorganization.template.core.domain.base.Criteria;
import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.transaction.annotation.Transactional;

public abstract class TemplateServiceBase<E, C extends Criteria> implements TemplateService<E, C> {

	private PagingAndSortingRepository<E, Long> repository;
	
	protected TemplateServiceBase(PagingAndSortingRepository<E, Long> repository) {
		super();
		this.repository = repository;
	}

	@Transactional(readOnly = true)
	public List<E> findAll() {
		return StreamSupport.stream(this.repository.findAll().spliterator(), false).collect(Collectors.toList());
	}
	
	@Transactional
	public E create(E entity) {
		return this.repository.save(entity);
	}
	
	@Transactional(readOnly = true)
	public Optional<E> read(Long id) {
		return this.repository.findById(id);
	}

	@Transactional
	public Long delete(Long id) {
		this.repository.deleteById(id);
		return id;
	}
	
	public PagingAndSortingRepository<E, Long> getRepository() {
		return repository;
	}
}
