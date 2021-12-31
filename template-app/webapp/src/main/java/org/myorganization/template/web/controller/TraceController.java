package org.myorganization.template.web.controller;

import org.apache.commons.lang3.StringUtils;
import org.myorganization.template.core.domain.system.traces.Trace;
import org.myorganization.template.core.domain.system.traces.TraceCriteria;
import org.myorganization.template.core.services.system.TraceService;
import org.myorganization.template.web.controller.base.TemplateController;
import org.myorganization.template.web.controller.base.TemplateControllerBase;
import org.myorganization.template.web.domain.datatables.criteria.DataTablesCriteria;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/traces")
public class TraceController extends TemplateControllerBase<Trace, TraceCriteria> implements TemplateController<Trace, TraceCriteria> {

	@Autowired
	public TraceController(TraceService traceService) {
		super(traceService);
	}
	
	@Override
	protected TraceCriteria buildCriteria(DataTablesCriteria dtCriteria) {
		TraceCriteria criteria;

		criteria = new TraceCriteria();

		if (StringUtils.isNotEmpty(dtCriteria.getSearch().getValue())) {
			criteria.setMessage(dtCriteria.getSearch().getValue());
		}

		return criteria;
	}
	
}
