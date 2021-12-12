package org.myorganization.template.web.controller;

import org.myorganization.template.core.domain.security.actions.Action;
import org.myorganization.template.core.domain.security.actions.ActionCriteria;
import org.myorganization.template.core.services.security.ActionService;
import org.myorganization.template.web.controller.base.TemplateController;
import org.myorganization.template.web.controller.base.TemplateControllerBase;
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
	
}
