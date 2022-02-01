package org.myorganization.template.web.controller;

import java.util.Optional;

import org.apache.commons.lang3.StringUtils;
import org.myorganization.template.security.domain.profiles.Profile;
import org.myorganization.template.security.domain.profiles.ProfileCriteria;
import org.myorganization.template.security.service.ProfileService;
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
@RequestMapping("/api/profiles")
@Slf4j
public class ProfileController extends TemplateControllerBase<Profile, ProfileCriteria> implements TemplateController<Profile, ProfileCriteria> { 

	@Autowired
	public ProfileController(ProfileService profileService) {
		super(profileService);
	}
	
	@Override
	protected ProfileCriteria buildCriteria(DataTablesCriteria<ProfileCriteria> dtCriteria) {
		ProfileCriteria criteria;

		criteria = (dtCriteria.getCriteria() != null) ? dtCriteria.getCriteria() : new ProfileCriteria();

		if (StringUtils.isNotEmpty(dtCriteria.getParameters().getSearch().getValue())) {
			criteria.setName(dtCriteria.getParameters().getSearch().getValue());
		}

		return criteria;
	}
	
	@GetMapping("/exist/{name}")
	public ResponseEntity<Boolean> existName(@PathVariable("name") String name) {
		log.info("name: {}", name);

		Optional<Boolean> exists = ((ProfileService) super.getService()).existByName(name);
		if (exists.isPresent()) {
			return ResponseEntity.ok(exists.get());
		}
		return ResponseEntity.notFound().build();
	}
	
}
