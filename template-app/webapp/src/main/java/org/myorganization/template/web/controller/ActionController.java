package org.myorganization.template.web.controller;

import java.net.URI;
import java.util.List;
import java.util.Optional;

import org.myorganization.template.core.domain.security.Action;
import org.myorganization.template.core.domain.security.ActionCriteria;
import org.myorganization.template.core.services.security.ActionService;
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
@RequestMapping("/api/actions")
public class ActionController {
	
	private static final Logger LOGGER = LoggerFactory.getLogger(ReportController.class);
	
	@Autowired
	private ActionService actionService;
	
	@GetMapping
	public ResponseEntity<List<Action>> findAll() {
		List<Action> actions = actionService.findAll();
		if (actions.isEmpty()) {
			return ResponseEntity.noContent().build();
		}
		return ResponseEntity.ok(actions);
	}

	@PostMapping("/search")
	public ResponseEntity<List<Action>> findByCriteria(@RequestBody ActionCriteria criteria) {
		
		LOGGER.info("find by criteria: " + criteria);
		
		List<Action> actions = actionService.findByCriteria(criteria);
		if (actions.isEmpty()) {
			return ResponseEntity.noContent().build();
		}
		return ResponseEntity.ok(actions);
	}
	
	@PostMapping("/count")
	public ResponseEntity<Long> countByCriteria(@RequestBody ActionCriteria criteria) {
		
		LOGGER.info("find by criteria: " + criteria);
		
		Long records = actionService.countByCriteria(criteria);

		return ResponseEntity.ok(records);
	}
	
	@PostMapping
	public ResponseEntity<Action> create(@RequestBody Action action) {
		action = actionService.create(action);
		
		if (action == null) {
			return ResponseEntity.noContent().build();
		}

		URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(action.getId()).toUri();
		return ResponseEntity.created(location).build();
	}

	@GetMapping("/{id}")
	public ResponseEntity<Action> read(@PathVariable("id") Long id) {
		Optional<Action> action = this.actionService.read(id);
		if (action.isPresent()) {
			return ResponseEntity.ok(action.get());
		}
		return ResponseEntity.notFound().build();
	}
	
	@PutMapping("/{id}")
	public ResponseEntity<Action> update(@PathVariable Long id, @RequestBody Action action) {
		
		LOGGER.info("update {} - {}", id, action);
		
		action = this.actionService.update(id, action);
		if (null == action) {
			return ResponseEntity.notFound().build();
		}

		return ResponseEntity.ok(action);
	}
	
	@DeleteMapping("/{id}")
	public ResponseEntity<Long> delete(@PathVariable("id") Long id) {
		
		if (null == this.actionService.delete(id)) {
			return ResponseEntity.notFound().build();
		}

		return ResponseEntity.ok(id);
	}
}
