package org.myorganization.template.web.controller;

import java.net.URI;
import java.util.List;
import java.util.Optional;

import org.myorganization.template.core.domain.security.User;
import org.myorganization.template.core.domain.security.UserCriteria;
import org.myorganization.template.core.services.security.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequestMapping("/api/users")
public class UserController {
	
	private static final Logger LOGGER = LoggerFactory.getLogger(ReportController.class);
	
	@Autowired
	private UserService userService;
	
	@GetMapping
	public ResponseEntity<List<User>> findAll() {
		List<User> users = userService.findAll();
		if (users.isEmpty()) {
			return ResponseEntity.noContent().build();
		}
		return ResponseEntity.ok(users);
	}

	@PostMapping("/search")
	public ResponseEntity<List<User>> findByCriteria(@RequestBody UserCriteria criteria) {
		
		LOGGER.info("find by criteria: " + criteria);
		
		List<User> users = userService.findByCriteria(criteria);
		if (users.isEmpty()) {
			return ResponseEntity.noContent().build();
		}
		return ResponseEntity.ok(users);
	}
	
	@PostMapping("/count")
	public ResponseEntity<Long> countByCriteria(@RequestBody UserCriteria criteria) {
		
		LOGGER.info("find by criteria: " + criteria);
		
		Long records = userService.countByCriteria(criteria);

		return ResponseEntity.ok(records);
	}
	
	@PostMapping
	public ResponseEntity<User> create(@RequestBody User user) {
		user = userService.create(user);
		
		if (user == null) {
			return ResponseEntity.noContent().build();
		}

		URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(user.getId()).toUri();
		return ResponseEntity.created(location).build();
	}

	@GetMapping("/{id}")
	public ResponseEntity<User> read(@PathVariable("id") Long id) {
		Optional<User> user = this.userService.read(id);
		if (user.isPresent()) {
			return ResponseEntity.ok(user.get());
		}
		return ResponseEntity.notFound().build();
	}
	
	@PutMapping("/{id}")
	public ResponseEntity<User> update(@PathVariable Long id, @RequestBody User user) {
		
		LOGGER.info("update {} - {}", id, user);
		
		user = this.userService.update(id, user);
		if (null == user) {
			return ResponseEntity.notFound().build();
		}

		return ResponseEntity.ok(user);
	}
	
	@DeleteMapping("/{id}")
	public ResponseEntity<Long> delete(@PathVariable("id") Long id) {
		
		if (null == this.userService.delete(id)) {
			return ResponseEntity.notFound().build();
		}

		return ResponseEntity.ok(id);
	}
}
