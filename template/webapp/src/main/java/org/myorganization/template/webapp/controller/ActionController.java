package org.myorganization.template.webapp.controller;

import org.myorganization.template.domain.dto.ActionDTO;
import org.myorganization.template.domain.enums.ActionType;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

/**
 * REST controller contract for action (permission) management.
 * <p>
 * Actions are read-only entities seeded via Liquibase. Only updates to name,
 * description and type are permitted. Creation and deletion are not allowed
 * and return 405 Method Not Allowed.
 */
public interface ActionController {

    /**
     * Lists actions with pagination and optional filters.
     *
     * @param page zero-indexed page number
     * @param size page size
     * @param code filter by action code (partial match)
     * @param name filter by action name (partial match)
     * @param type filter by action type
     * @return 200 OK with paginated action list
     */
    @GetMapping
    ResponseEntity<Page<ActionDTO>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) ActionType type,
            @RequestParam(required = false) String sort);

    /**
     * Counts actions matching the given filters.
     *
     * @param code filter by action code (partial match)
     * @param name filter by action name (partial match)
     * @param type filter by action type
     * @return 200 OK with the total count
     */
    @GetMapping("/count")
    ResponseEntity<Long> count(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) ActionType type);

    /**
     * Retrieves an action by its identifier.
     *
     * @param id the action identifier
     * @return 200 OK with the action, or 404 if not found
     */
    @GetMapping("/{id}")
    ResponseEntity<ActionDTO> findById(@PathVariable Long id);

    /**
     * Updates an existing action.
     *
     * @param id  the action identifier
     * @param dto the updated action data
     * @return 200 OK with the updated action
     */
    @PutMapping("/{id}")
    ResponseEntity<ActionDTO> update(@PathVariable Long id, @RequestBody ActionDTO dto);

    /**
     * Rejects action creation with 405 Method Not Allowed.
     *
     * @param dto ignored
     * @return 405 Method Not Allowed
     */
    @PostMapping
    ResponseEntity<ActionDTO> create(@RequestBody ActionDTO dto);

    /**
     * Rejects action deletion with 405 Method Not Allowed.
     *
     * @param id ignored
     * @return 405 Method Not Allowed
     */
    @DeleteMapping("/{id}")
    ResponseEntity<Void> delete(@PathVariable Long id);

}
