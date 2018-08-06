package org.myorganization.template.core.services.security;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.myorganization.template.core.domain.security.Profile;
import org.myorganization.template.core.domain.security.ProfileCriteria;
import org.myorganization.template.core.domain.security.ProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {

	@Autowired
	private ProfileRepository profileRepository;
	
	@Transactional(readOnly = true)
	public List<Profile> findAll() {
		List<Profile> profiles = new ArrayList<>();
		for (Profile profile : this.profileRepository.findAll()) {
			profiles.add(profile);
		}
		return profiles;
	}
	
	@Transactional(readOnly = true)
	public List<Profile> findByCriteria(ProfileCriteria criteria) {
		List<Profile> profiles = this.profileRepository.findByCriteria(criteria);
		return profiles;
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
	public Profile read(Long id) {
		Optional<Profile> report = this.profileRepository.findById(id);
		if (report.isPresent()) {
			return report.get();
		} 
		//TODO Not Found Exception....
		return null;
	}
	
	@Transactional
	public Profile update(Long id, Profile profile) {
		Optional<Profile> optional = this.profileRepository.findById(id);
		if (optional.isPresent()) {
			Profile p = optional.get();
			p.setName(profile.getName());
			
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
