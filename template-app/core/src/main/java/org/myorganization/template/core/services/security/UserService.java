package org.myorganization.template.core.services.security;

import java.util.List;

import org.myorganization.template.core.domain.security.users.User;
import org.myorganization.template.core.domain.security.users.UserCriteria;
import org.myorganization.template.core.domain.security.users.UserRepository;
import org.myorganization.template.core.services.base.TemplateService;
import org.myorganization.template.core.services.base.TemplateServiceBase;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService extends TemplateServiceBase<User, UserCriteria> implements TemplateService<User, UserCriteria> {

	@Autowired
	public UserService(UserRepository userRepository) {
		super(userRepository);
	}

	@Transactional(readOnly = true)
	public List<User> findByCriteria(UserCriteria criteria) {
		return ((UserRepository) super.getRepository()).findByCriteria(criteria);
	}
	
	@Transactional(readOnly = true)
	public Long countByCriteria(UserCriteria criteria) {
		return ((UserRepository) super.getRepository()).countByCriteria(criteria);
	}

	@Transactional
	public User update(Long id, User user) {
		return this.read(id).map(u -> {
			
			u.setUsername(user.getUsername());
			u.setPassword(user.getPassword());
			
			return super.getRepository().save(u);
		}).orElseGet(() -> null);
	}

}
