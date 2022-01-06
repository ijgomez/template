package org.myorganization.template.web.controller;

import org.apache.commons.lang3.StringUtils;
import org.myorganization.template.security.domain.actions.Action;
import org.myorganization.template.security.domain.actions.ActionCriteria;
import org.myorganization.template.security.service.ActionService;
import org.myorganization.template.web.controller.base.TemplateController;
import org.myorganization.template.web.controller.base.TemplateControllerBase;
import org.myorganization.template.web.domain.datatables.DataTablesCriteria;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/actions")
public class ActionController extends TemplateControllerBase<Action, ActionCriteria> implements TemplateController<Action, ActionCriteria> {

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
}
