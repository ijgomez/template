package org.myorganization.template.security.service;

import java.util.List;

import org.myorganization.template.core.services.base.TemplateService;
import org.myorganization.template.core.services.base.TemplateServiceBase;
import org.myorganization.template.security.domain.profiles.Profile;
import org.myorganization.template.security.domain.profiles.ProfileCriteria;
import org.myorganization.template.security.domain.profiles.ProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService extends TemplateServiceBase<Profile, ProfileCriteria> implements TemplateService<Profile, ProfileCriteria> {

	@Autowired
	public ProfileService(ProfileRepository profileRepository) {
		super(profileRepository);
	}

	@Transactional(readOnly = true)
	public List<Profile> findByCriteria(ProfileCriteria criteria) {
		return ((ProfileRepository) super.getRepository()).findByCriteria(criteria);
	}

	@Transactional(readOnly = true)
	public Long countByCriteria(ProfileCriteria criteria) {
		return ((ProfileRepository) super.getRepository()).countByCriteria(criteria);
	}

	@Transactional
	public Profile update(Long id, Profile profile) {
		return super.read(id).map(p -> {
			
			p.setName(profile.getName());
			p.setDescription(profile.getDescription());
			p.setActions(profile.getActions());
			
			return super.getRepository().save(p);
		}).orElseGet(() -> null);

	}

}
