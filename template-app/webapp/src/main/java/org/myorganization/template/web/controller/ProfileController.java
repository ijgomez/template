package org.myorganization.template.web.controller;

import java.net.URI;
import java.util.List;
import java.util.Optional;

import org.myorganization.template.core.domain.security.Profile;
import org.myorganization.template.core.domain.security.ProfileCriteria;
import org.myorganization.template.core.services.security.ProfileService;
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
@RequestMapping("/api/profiles")
public class ProfileController {
	
	private static final Logger LOGGER = LoggerFactory.getLogger(ReportController.class);
	
	@Autowired
	private ProfileService profileService;
	
	@GetMapping
	public ResponseEntity<List<Profile>> findAll() {
		List<Profile> profiles = profileService.findAll();
		if (profiles.isEmpty()) {
			return ResponseEntity.noContent().build();
		}
		return ResponseEntity.ok(profiles);
	}

	@PostMapping("/search")
	public ResponseEntity<List<Profile>> findByCriteria(@RequestBody ProfileCriteria criteria) {
		
		LOGGER.info("find by criteria: " + criteria);
		
		List<Profile> profiles = profileService.findByCriteria(criteria);
		if (profiles.isEmpty()) {
			return ResponseEntity.noContent().build();
		}
		return ResponseEntity.ok(profiles);
	}
	
	@PostMapping("/count")
	public ResponseEntity<Long> countByCriteria(@RequestBody ProfileCriteria criteria) {
		
		LOGGER.info("find by criteria: " + criteria);
		
		Long records = profileService.countByCriteria(criteria);

		return ResponseEntity.ok(records);
	}
	
	@PostMapping
	public ResponseEntity<Profile> create(@RequestBody Profile profile) {
		profile = profileService.create(profile);
		
		if (profile == null) {
			return ResponseEntity.noContent().build();
		}

		URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(profile.getId()).toUri();
		return ResponseEntity.created(location).build();
	}

	@GetMapping("/{id}")
	public ResponseEntity<Profile> read(@PathVariable("id") Long id) {
		Optional<Profile> profile = this.profileService.read(id);
		if (profile.isPresent()) {
			return ResponseEntity.ok(profile.get());
		}
		return ResponseEntity.notFound().build();
	}
	
	@PutMapping("/{id}")
	public ResponseEntity<Profile> update(@PathVariable Long id, @RequestBody Profile profile) {
		
		LOGGER.info("update {} - {}", id, profile);
		
		profile = this.profileService.update(id, profile);
		if (null == profile) {
			return ResponseEntity.notFound().build();
		}

		return ResponseEntity.ok(profile);
	}
	
	@DeleteMapping("/{id}")
	public ResponseEntity<Long> delete(@PathVariable("id") Long id) {
		
		if (null == this.profileService.delete(id)) {
			return ResponseEntity.notFound().build();
		}

		return ResponseEntity.ok(id);
	}
}
