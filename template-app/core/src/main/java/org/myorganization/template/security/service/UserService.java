package org.myorganization.template.security.service;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;

import org.myorganization.template.core.services.base.TemplateServiceBase;
import org.myorganization.template.security.domain.actions.Action;
import org.myorganization.template.security.domain.users.User;
import org.myorganization.template.security.domain.users.UserCriteria;
import org.myorganization.template.security.domain.users.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService extends TemplateServiceBase<User, UserCriteria> {

//	@Autowired
//	private PasswordEncoder passwordEncoder;
	
	@Autowired
	private ActionService actionService;
	
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
	
	@Transactional(readOnly = true)
	public Optional<User> findByUsername(String username) {
		UserCriteria criteria;
		
		criteria = new UserCriteria();
		criteria.setUsername(username);

		List<User> result = ((UserRepository) super.getRepository()).findByCriteria(criteria);
		
		if (result != null && result.size() == 1) {
			return Optional.of(result.get(0));
		}
		return Optional.empty();
	}

	@Transactional
	public void updateLastLoginDate(Long id) {
		this.read(id).ifPresent(u -> {
			u.setLastAccess(ZonedDateTime.now());
			
			super.getRepository().save(u);
		});
	}

	@Transactional(readOnly = true)
	public Optional<Boolean> existByUsername(String username) {
		return ((UserRepository) super.getRepository()).existByUsername(username);
	}

	@Transactional(readOnly = true)
	public Optional<List<Action>> findActionsByUsername(String username) {
		return this.actionService.findActionsByUsername(username);
	}

}
