package org.myorganization.template.core.services.security;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.myorganization.template.core.domain.security.Action;
import org.myorganization.template.core.domain.security.ActionCriteria;
import org.myorganization.template.core.domain.security.ActionRepository;
import org.myorganization.template.core.services.base.TemplateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ActionService implements TemplateService<Action, ActionCriteria> {

	@Autowired
	private ActionRepository actionRepository;
	
	@Transactional(readOnly = true)
	public List<Action> findAll() {
		List<Action> actions = new ArrayList<>();
		for (Action action : this.actionRepository.findAll()) {
			actions.add(action);
		}
		return actions;
	}
	
	@Transactional(readOnly = true)
	public List<Action> findByCriteria(ActionCriteria criteria) {
		List<Action> actions = this.actionRepository.findByCriteria(criteria);
		return actions;
	}
	
	@Transactional(readOnly = true)
	public Long countByCriteria(ActionCriteria criteria) {
		return this.actionRepository.countByCriteria(criteria);
	}
	
	@Transactional
	public Action create(Action action) {
		return this.actionRepository.save(action);
	}
	
	@Transactional(readOnly = true)
	public Optional<Action> read(Long id) {
		return this.actionRepository.findById(id);
	}
	
	@Transactional
	public Action update(Long id, Action action) {
		Optional<Action> optional = this.read(id);
		if (optional.isPresent()) {
			Action a = optional.get();
			a.setName(action.getName());
			a.setDescription(action.getDescription());
			
			return this.actionRepository.save(a);
		} 
		//TODO Not Found Exception....
		return null;
	}
	
	@Transactional
	public Long delete(Long id) {
		this.actionRepository.deleteById(id);
		return id;
	}
}
