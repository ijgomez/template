package org.myorganization.template.core.service;

import org.myorganization.template.core.repository.ActionRepository;
import org.myorganization.template.domain.criteria.ActionCriteria;
import org.myorganization.template.domain.dto.ActionDTO;
import org.myorganization.template.domain.entity.Action;
import org.myorganization.template.domain.exception.EntityNotFoundException;
import org.myorganization.template.domain.exception.MethodNotAllowedException;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for managing actions (permissions).
 * <p>
 * Actions are seeded via Liquibase and cannot be created or deleted via the API.
 * Only updates to name, description, and type are permitted.
 */
@Service
public class ActionService extends AbstractCriteriaService<Action, ActionDTO, ActionCriteria> {

    private final ActionRepository actionRepository;

    public ActionService(ActionRepository actionRepository) {
        super(actionRepository);
        this.actionRepository = actionRepository;
    }

    /**
     * Finds an action by its identifier.
     *
     * @param id the action identifier
     * @return the action as a DTO
     * @throws EntityNotFoundException if no action exists with the given id
     */
    @Transactional(readOnly = true)
    public ActionDTO findById(Long id) {
        Action action = actionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Action", id));
        return toDTO(action);
    }

    /**
     * Updates an existing action's name, description, and type.
     *
     * @param id  the action identifier
     * @param dto the updated action data
     * @return the updated action as a DTO
     * @throws EntityNotFoundException if no action exists with the given id
     */
    @Transactional
    public ActionDTO update(Long id, ActionDTO dto) {
        Action action = actionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Action", id));

        action.setName(dto.name());
        action.setDescription(dto.description());
        action.setType(dto.type());

        Action saved = actionRepository.save(action);
        return toDTO(saved);
    }

    /**
     * Rejects action creation. Actions are seeded via Liquibase only.
     *
     * @param dto ignored
     * @throws MethodNotAllowedException always
     */
    public ActionDTO create(ActionDTO dto) {
        throw new MethodNotAllowedException("Action creation is not allowed. Actions are managed via seed data.");
    }

    /**
     * Rejects action deletion. Actions cannot be removed from the system.
     *
     * @param id ignored
     * @throws MethodNotAllowedException always
     */
    public void delete(Long id) {
        throw new MethodNotAllowedException("Action deletion is not allowed. Actions are managed via seed data.");
    }

    @Override
    protected Specification<Action> buildSpecification(ActionCriteria criteria) {
        Specification<Action> spec = (root, query, cb) -> cb.conjunction();

        if (criteria.code() != null && !criteria.code().isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("code")), "%" + criteria.code().toLowerCase() + "%"));
        }

        if (criteria.name() != null && !criteria.name().isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("name")), "%" + criteria.name().toLowerCase() + "%"));
        }

        if (criteria.type() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("type"), criteria.type()));
        }

        return spec;
    }

    @Override
    protected ActionDTO toDTO(Action action) {
        return new ActionDTO(
                action.getId(),
                action.getCode(),
                action.getType(),
                action.getName(),
                action.getDescription(),
                action.getCreatedAt(),
                action.getLastModifiedAt()
        );
    }
}
