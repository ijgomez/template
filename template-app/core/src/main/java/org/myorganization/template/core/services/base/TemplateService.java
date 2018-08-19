package org.myorganization.template.core.services.base;

import java.util.List;

import org.myorganization.template.core.domain.base.Criteria;

public interface TemplateService<E, C extends Criteria> {

	public List<E> findAll();
	
	public List<E> findByCriteria(C criteria);
	
	public Long countByCriteria(C criteria);
	
	public E create(E entity);
	
	public E read(Long id);
	
	public E update(Long id, E entity);
	
	public Long delete(Long id);
}
