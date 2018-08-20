package org.myorganization.template.core.services.security;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import org.myorganization.template.core.domain.security.User;
import org.myorganization.template.core.domain.security.UserCriteria;
import org.myorganization.template.core.domain.security.UserRepository;
import org.myorganization.template.core.services.base.TemplateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService implements TemplateService<User, UserCriteria> {

	@Autowired
	private UserRepository userRepository;
	
	@Transactional(readOnly = true)
	public List<User> findAll() {
		return StreamSupport.stream(this.userRepository.findAll().spliterator(), false).collect(Collectors.toList());
	}
	
	@Transactional(readOnly = true)
	public List<User> findByCriteria(UserCriteria criteria) {
		return this.userRepository.findByCriteria(criteria);
	}
	
	@Transactional(readOnly = true)
	public Long countByCriteria(UserCriteria criteria) {
		return this.userRepository.countByCriteria(criteria);
	}
	
	@Transactional
	public User create(User user) {
		return this.userRepository.save(user);
	}
	
	@Transactional(readOnly = true)
	public Optional<User> read(Long id) {
		return this.userRepository.findById(id);
	}
	
	@Transactional
	public User update(Long id, User user) {
		Optional<User> optional = this.read(id);
		if (optional.isPresent()) {
			User u = optional.get();
			u.setUsername(user.getUsername());
			u.setPassword(user.getPassword());
			
			return this.userRepository.save(u);
		} 
		//TODO Not Found Exception....
		return null;
	}
	
	@Transactional
	public Long delete(Long id) {
		this.userRepository.deleteById(id);
		return id;
	}
}
