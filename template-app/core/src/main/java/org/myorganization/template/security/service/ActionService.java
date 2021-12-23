package org.myorganization.template.security.service;

import java.util.List;

import org.myorganization.template.core.services.base.TemplateService;
import org.myorganization.template.core.services.base.TemplateServiceBase;
import org.myorganization.template.security.domain.actions.Action;
import org.myorganization.template.security.domain.actions.ActionCriteria;
import org.myorganization.template.security.domain.actions.ActionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ActionService extends TemplateServiceBase<Action, ActionCriteria> implements TemplateService<Action, ActionCriteria> {

	@Autowired
	public ActionService(ActionRepository actionRepository) {
		super(actionRepository);
	}

	@Transactional(readOnly = true)
	public List<Action> findByCriteria(ActionCriteria criteria) {
		return ((ActionRepository)super.getRepository()).findByCriteria(criteria);
	}
	
	@Transactional(readOnly = true)
	public Long countByCriteria(ActionCriteria criteria) {
		return ((ActionRepository)super.getRepository()).countByCriteria(criteria);
	}

	@Transactional
	public Action update(Long id, Action action) {
		return super.read(id).map(a -> {
			
			a.setName(action.getName());
			a.setDescription(action.getDescription());
			
			return super.getRepository().save(a);
		}).orElseGet(() -> null);
	}

}
