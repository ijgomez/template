package org.myorganization.template.core.services.system;

import java.util.List;

import org.myorganization.template.core.domain.system.properties.Property;
import org.myorganization.template.core.domain.system.properties.PropertyCriteria;
import org.myorganization.template.core.domain.system.properties.PropertyRepository;
import org.myorganization.template.core.services.base.TemplateService;
import org.myorganization.template.core.services.base.TemplateServiceBase;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PropertyService extends TemplateServiceBase<Property, PropertyCriteria> implements TemplateService<Property, PropertyCriteria> {

	@Autowired
	public PropertyService(PropertyRepository propertyRepository) {
		super(propertyRepository);
	}

	@Transactional(readOnly = true)
	public List<Property> findByCriteria(PropertyCriteria criteria) {
		return ((PropertyRepository) super.getRepository()).findByCriteria(criteria);
	}
	
	@Transactional(readOnly = true)
	public Long countByCriteria(PropertyCriteria criteria) {
		return ((PropertyRepository) super.getRepository()).countByCriteria(criteria);
	}

	@Transactional(readOnly = true)
	public Long readNumericValue(String property) {
		return Long.valueOf(((PropertyRepository) super.getRepository()).findByProperty(property).getValue());
	}
	
	@Transactional
	public Property update(Long id, Property property) {
		return this.read(id).map(p -> {
			
			p.setProperty(property.getProperty());
			p.setValue(property.getValue());
			
			return super.getRepository().save(p);
		}).orElseGet(() -> null);

	}
	

}
