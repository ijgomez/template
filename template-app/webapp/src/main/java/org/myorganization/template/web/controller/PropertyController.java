package org.myorganization.template.web.controller;

import org.apache.commons.lang3.StringUtils;
import org.myorganization.template.core.domain.system.properties.Property;
import org.myorganization.template.core.domain.system.properties.PropertyCriteria;
import org.myorganization.template.core.services.system.PropertyService;
import org.myorganization.template.web.controller.base.TemplateController;
import org.myorganization.template.web.controller.base.TemplateControllerBase;
import org.myorganization.template.web.domain.datatables.DataTablesCriteria;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/properties")
public class PropertyController extends TemplateControllerBase<Property, PropertyCriteria> implements TemplateController<Property, PropertyCriteria> {
	
	@Autowired
	public PropertyController(PropertyService propertyService) {
		super(propertyService);
	}
	
	@Override
	protected PropertyCriteria buildCriteria(DataTablesCriteria<PropertyCriteria> dtCriteria) {
		PropertyCriteria criteria;

		criteria = (dtCriteria.getCriteria() != null) ? dtCriteria.getCriteria() : new PropertyCriteria();

		if (StringUtils.isNotEmpty(dtCriteria.getParameters().getSearch().getValue())) {
			criteria.setProperty(dtCriteria.getParameters().getSearch().getValue());
		}

		return criteria;
	}
	
}
