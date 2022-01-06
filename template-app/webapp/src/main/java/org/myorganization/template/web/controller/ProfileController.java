package org.myorganization.template.web.controller;

import org.apache.commons.lang3.StringUtils;
import org.myorganization.template.security.domain.profiles.Profile;
import org.myorganization.template.security.domain.profiles.ProfileCriteria;
import org.myorganization.template.security.service.ProfileService;
import org.myorganization.template.web.controller.base.TemplateController;
import org.myorganization.template.web.controller.base.TemplateControllerBase;
import org.myorganization.template.web.domain.datatables.DataTablesCriteria;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/profiles")
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
	
}
