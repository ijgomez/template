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
//@Slf4j
public class UserController extends TemplateControllerBase<User, UserCriteria> implements TemplateController<User, UserCriteria>  {

//	@Autowired
//	private BCryptPasswordEncoder bCryptPasswordEncoder;
	
	@Autowired
	protected UserController(UserService userService) {
		super(userService);
	}
	
//	@Override
//	public ResponseEntity<User> create(User user) {
//		if (user != null) {
//			user.setPassword(bCryptPasswordEncoder.encode(user.getPassword()));
//		}
//		return super.create(user);
//	}
//
//	@GetMapping("/{username}")
//	public ResponseEntity<User> findByUsername(@PathVariable("username") String username) {
//		log.info("username: {}", username);
//
//		Optional<User> user = ((UserService) super.getService()).findByUsername(username);
//		if (user.isPresent()) {
//			return ResponseEntity.ok(user.get());
//		}
//		return ResponseEntity.notFound().build();
//	}
	

}
