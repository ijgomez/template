package org.myorganization.template.core.services.security;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.myorganization.template.core.domain.security.User;
import org.myorganization.template.core.domain.security.UserCriteria;
import org.myorganization.template.core.domain.security.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

	@Autowired
	private UserRepository userRepository;
	
	@Transactional(readOnly = true)
	public List<User> findAll() {
		List<User> users = new ArrayList<>();
		for (User user : this.userRepository.findAll()) {
			users.add(user);
		}
		return users;
	}
	
	@Transactional(readOnly = true)
	public List<User> findByCriteria(UserCriteria criteria) {
		List<User> users = this.userRepository.findByCriteria(criteria);
		return users;
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
	public User read(Long id) {
		Optional<User> user = this.userRepository.findById(id);
		if (user.isPresent()) {
			return user.get();
		} 
		//TODO Not Found Exception....
		return null;
	}
	
	@Transactional
	public User update(Long id, User user) {
		Optional<User> optional = this.userRepository.findById(id);
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
