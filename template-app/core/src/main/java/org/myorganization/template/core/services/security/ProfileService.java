package org.myorganization.template.core.services.security;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import org.myorganization.template.core.domain.security.Profile;
import org.myorganization.template.core.domain.security.ProfileCriteria;
import org.myorganization.template.core.domain.security.ProfileRepository;
import org.myorganization.template.core.services.base.TemplateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService implements TemplateService<Profile, ProfileCriteria> {

	@Autowired
	private ProfileRepository profileRepository;
	
	@Transactional(readOnly = true)
	public List<Profile> findAll() {
		return StreamSupport.stream(this.profileRepository.findAll().spliterator(), false).collect(Collectors.toList());
	}
	
	@Transactional(readOnly = true)
	public List<Profile> findByCriteria(ProfileCriteria criteria) {
		return this.profileRepository.findByCriteria(criteria);
	}
	
	@Transactional(readOnly = true)
	public Long countByCriteria(ProfileCriteria criteria) {
		return this.profileRepository.countByCriteria(criteria);
	}
	
	@Transactional
	public Profile create(Profile profile) {
		return this.profileRepository.save(profile);
	}
	
	@Transactional(readOnly = true)
	public Optional<Profile> read(Long id) {
		return this.profileRepository.findById(id);
	}
	
	@Transactional
	public Profile update(Long id, Profile profile) {
		Optional<Profile> optional = this.read(id);
		if (optional.isPresent()) {
			Profile p = optional.get();
			p.setName(profile.getName());
			p.setDescription(profile.getDescription());
			p.setActions(profile.getActions());
			
			return this.profileRepository.save(p);
		} 
		//TODO Not Found Exception....
		return null;
	}
	
	@Transactional
	public Long delete(Long id) {
		this.profileRepository.deleteById(id);
		return id;
	}
}
