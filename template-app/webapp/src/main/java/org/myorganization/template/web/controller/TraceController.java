package org.myorganization.template.web.controller;

import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.myorganization.template.core.domain.system.traces.Trace;
import org.myorganization.template.core.domain.system.traces.TraceCriteria;
import org.myorganization.template.core.domain.system.traces.TraceType;
import org.myorganization.template.core.services.system.TraceService;
import org.myorganization.template.web.controller.base.TemplateControllerBase;
import org.myorganization.template.web.domain.datatables.DataTablesCriteria;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/traces")
public class TraceController extends TemplateControllerBase<Trace, TraceCriteria> {

	@Autowired
	public TraceController(TraceService traceService) {
		super(traceService);
	}
	
	@Override
	protected TraceCriteria buildCriteria(DataTablesCriteria<TraceCriteria> dtCriteria) {
		TraceCriteria criteria;

		criteria = (dtCriteria.getCriteria() != null) ? dtCriteria.getCriteria() : new TraceCriteria();

		if (StringUtils.isNotEmpty(dtCriteria.getParameters().getSearch().getValue())) {
			criteria.setMessage(dtCriteria.getParameters().getSearch().getValue());
		}

		return criteria;
	}
	
	@GetMapping("/types")
	public ResponseEntity<List<TraceType>> types() {

		
		List<TraceType> types = ((TraceService) super.getService()).getAllTypes();
		
		return ResponseEntity.ok(types);
	}
	
}
