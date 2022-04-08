package org.myorganization.template.web.controller;

import java.util.Optional;

import org.apache.commons.lang3.StringUtils;
import org.myorganization.template.security.domain.actions.Action;
import org.myorganization.template.security.domain.actions.ActionCriteria;
import org.myorganization.template.security.service.ActionService;
import org.myorganization.template.web.controller.base.TemplateControllerBase;
import org.myorganization.template.web.domain.datatables.DataTablesCriteria;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.slf4j.Slf4j;

@RestController
@Validated
@RequestMapping("/api/actions")
@Slf4j
public class ActionController extends TemplateControllerBase<Action, ActionCriteria> {

	@Autowired
	public ActionController(ActionService actionService) {
		super(actionService);
	}
	
	@Override
	protected ActionCriteria buildCriteria(DataTablesCriteria<ActionCriteria> dtCriteria) {
		ActionCriteria criteria;

		criteria = (dtCriteria.getCriteria() != null) ? dtCriteria.getCriteria() : new ActionCriteria();

		if (StringUtils.isNotEmpty(dtCriteria.getParameters().getSearch().getValue())) {
			criteria.setName(dtCriteria.getParameters().getSearch().getValue());
		}

		return criteria;
	}
	
	@GetMapping("/exist/{name}")
	public ResponseEntity<Boolean> existName(@PathVariable("name") String name) {
		log.info("name: {}", name);

		Optional<Boolean> exists = ((ActionService) super.getService()).existByName(name);
		if (exists.isPresent()) {
			return ResponseEntity.ok(exists.get());
		}
		return ResponseEntity.notFound().build();
	}
}
