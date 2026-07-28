package org.myorganization.template.webapp.controller;

import org.myorganization.template.core.service.ActionService;
import org.myorganization.template.domain.criteria.ActionCriteria;
import org.myorganization.template.domain.dto.ActionDTO;
import org.myorganization.template.domain.enums.ActionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller implementation for action (permission) management.
 * <p>
 * Actions are seeded via Liquibase and cannot be created or deleted via the API.
 * Only updates to name, description and type are permitted.
 * POST and DELETE operations delegate to {@link ActionService} which throws
 * {@link org.myorganization.template.domain.exception.MethodNotAllowedException}.
 */
@RestController
@RequestMapping("/api/v1/administration/security/actions")
public class ActionControllerImpl implements ActionController {

    private final ActionService actionService;

    public ActionControllerImpl(ActionService actionService) {
        this.actionService = actionService;
    }

    @Override
    public ResponseEntity<Page<ActionDTO>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) ActionType type) {

        ActionCriteria criteria = new ActionCriteria(code, name, type);
        Pageable pageable = PageRequest.of(page, size);
        Page<ActionDTO> result = actionService.findByCriteria(criteria, pageable);
        return ResponseEntity.ok(result);
    }

    @Override
    public ResponseEntity<Long> count(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) ActionType type) {

        ActionCriteria criteria = new ActionCriteria(code, name, type);
        long total = actionService.countByCriteria(criteria);
        return ResponseEntity.ok(total);
    }

    @Override
    public ResponseEntity<ActionDTO> findById(@PathVariable Long id) {
        ActionDTO action = actionService.findById(id);
        return ResponseEntity.ok(action);
    }

    @Override
    public ResponseEntity<ActionDTO> update(@PathVariable Long id, @RequestBody ActionDTO dto) {
        ActionDTO updated = actionService.update(id, dto);
        return ResponseEntity.ok(updated);
    }

    @Override
    public ResponseEntity<ActionDTO> create(@RequestBody ActionDTO dto) {
        // Delegates to ActionService which throws MethodNotAllowedException
        ActionDTO created = actionService.create(dto);
        return ResponseEntity.ok(created);
    }

    @Override
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        // Delegates to ActionService which throws MethodNotAllowedException
        actionService.delete(id);
        return ResponseEntity.noContent().build();
    }

}
