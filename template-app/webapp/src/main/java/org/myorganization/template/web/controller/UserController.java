package org.myorganization.template.web.controller;

import java.util.List;
import java.util.Optional;

import org.apache.commons.lang3.StringUtils;
import org.myorganization.template.security.domain.actions.Action;
import org.myorganization.template.security.domain.users.User;
import org.myorganization.template.security.domain.users.UserCriteria;
import org.myorganization.template.security.service.UserService;
import org.myorganization.template.web.controller.base.TemplateController;
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
@RequestMapping("/api/users")
@Slf4j
public class UserController extends TemplateControllerBase<User, UserCriteria> implements TemplateController<User, UserCriteria>  {

	@Autowired
	protected UserController(UserService userService) {
		super(userService);
	}
	
	@Override
	protected UserCriteria buildCriteria(DataTablesCriteria<UserCriteria> dtCriteria) {
		UserCriteria criteria;
		
		criteria = (dtCriteria.getCriteria() != null) ? dtCriteria.getCriteria() : new UserCriteria();
		
		if (StringUtils.isNotEmpty(dtCriteria.getParameters().getSearch().getValue())) {
			criteria.setUsername(dtCriteria.getParameters().getSearch().getValue());
		}

		return criteria;
	}
	
	@GetMapping("/exist/{username}")
	public ResponseEntity<Boolean> existUsername(@PathVariable("username") String username) {
		log.info("username: {}", username);

		if (username == null || username.isBlank()) {
			return ResponseEntity.badRequest().build();
		} 
		
		Optional<Boolean> exists = ((UserService) super.getService()).existByUsername(username);
		if (exists.isPresent()) {
			return ResponseEntity.ok(exists.get());
		}
		return ResponseEntity.notFound().build();
	}
	
	@GetMapping("/{username}/actions")
	public ResponseEntity<List<Action>> findActionsByUsername(@PathVariable("username") String username) {
		log.info("user's actions: {}", username);

		if (username == null || username.isBlank()) {
			return ResponseEntity.badRequest().build();
		} 
		
		Optional<List<Action>> actions = ((UserService) super.getService()).findActionsByUsername(username);
		if (actions.isPresent()) {
			return ResponseEntity.ok(actions.get());
		}
		return ResponseEntity.notFound().build();
	}
	

}
