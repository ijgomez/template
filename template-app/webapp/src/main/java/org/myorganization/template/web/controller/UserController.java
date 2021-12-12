package org.myorganization.template.web.controller;

import org.myorganization.template.core.domain.security.users.User;
import org.myorganization.template.core.domain.security.users.UserCriteria;
import org.myorganization.template.core.services.security.UserService;
import org.myorganization.template.web.controller.base.TemplateController;
import org.myorganization.template.web.controller.base.TemplateControllerBase;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/users")
public class UserController extends TemplateControllerBase<User, UserCriteria> implements TemplateController<User, UserCriteria>  {

	@Autowired
	protected UserController(UserService userService) {
		super(userService);
	}

}
