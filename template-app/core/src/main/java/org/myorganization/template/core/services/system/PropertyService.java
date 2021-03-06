package org.myorganization.template.core.services.system;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import org.myorganization.template.core.domain.system.properties.Property;
import org.myorganization.template.core.domain.system.properties.PropertyCriteria;
import org.myorganization.template.core.domain.system.properties.PropertyRepository;
import org.myorganization.template.core.services.base.TemplateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PropertyService implements TemplateService<Property, PropertyCriteria> {

	@Autowired
	private PropertyRepository propertyRepository;
	
	@Transactional(readOnly = true)
	public List<Property> findAll() {
		return StreamSupport.stream(this.propertyRepository.findAll().spliterator(), false).collect(Collectors.toList());
	}
	
	@Transactional(readOnly = true)
	public List<Property> findByCriteria(PropertyCriteria criteria) {
		return this.propertyRepository.findByCriteria(criteria);
	}
	
	@Transactional(readOnly = true)
	public Long countByCriteria(PropertyCriteria criteria) {
		return this.propertyRepository.countByCriteria(criteria);
	}
	
	@Transactional
	public Property create(Property property) {
		return this.propertyRepository.save(property);
	}
	
	@Transactional(readOnly = true)
	public Optional<Property> read(Long id) {
		return this.propertyRepository.findById(id);
	}
	
	@Transactional(readOnly = true)
	public Long readNumericValue(String property) {
		return Long.valueOf(this.propertyRepository.findByProperty(property).getValue());
	}
	
	@Transactional
	public Property update(Long id, Property property) {
		Optional<Property> optional = this.read(id);
		if (optional.isPresent()) {
			Property p = optional.get();
			p.setProperty(property.getProperty());
			p.setValue(property.getValue());
			
			return this.propertyRepository.save(p);
		} 
		//TODO Not Found Exception....
		return null;
	}
	
	@Transactional
	public Long delete(Long id) {
		this.propertyRepository.deleteById(id);
		return id;
	}
}
