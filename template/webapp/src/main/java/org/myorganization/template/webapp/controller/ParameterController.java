package org.myorganization.template.webapp.controller;

import org.myorganization.template.core.service.ParameterService;
import org.myorganization.template.domain.criteria.ParameterCriteria;
import org.myorganization.template.domain.dto.ParameterDTO;
import org.myorganization.template.domain.enums.ParameterType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

/**
 * REST controller for system parameter management.
 * <p>
 * Exposes CRUD endpoints for parameters under the administration module.
 * Parameters are identified by their unique code (String), not a numeric ID.
 */
@RestController
@RequestMapping("/api/v1/administration/parameters")
public class ParameterController {

    private final ParameterService parameterService;

    public ParameterController(ParameterService parameterService) {
        this.parameterService = parameterService;
    }

    /**
     * Lists parameters with pagination and optional filters.
     *
     * @param code        optional filter by parameter code (partial match)
     * @param description optional filter by description (partial match)
     * @param type        optional filter by parameter type
     * @param pageable    pagination information (page, size, sort)
     * @return 200 OK with paginated list of parameters
     */
    @GetMapping
    public ResponseEntity<Page<ParameterDTO>> findAll(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) ParameterType type,
            Pageable pageable) {

        ParameterCriteria criteria = new ParameterCriteria(code, description, type);
        Page<ParameterDTO> page = parameterService.findByCriteria(criteria, pageable);
        return ResponseEntity.ok(page);
    }

    /**
     * Counts parameters matching the given filters.
     *
     * @param code        optional filter by parameter code (partial match)
     * @param description optional filter by description (partial match)
     * @param type        optional filter by parameter type
     * @return 200 OK with the total count
     */
    @GetMapping("/count")
    public ResponseEntity<Long> count(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) ParameterType type) {

        ParameterCriteria criteria = new ParameterCriteria(code, description, type);
        long total = parameterService.countByCriteria(criteria);
        return ResponseEntity.ok(total);
    }

    /**
     * Creates a new system parameter.
     *
     * @param dto the parameter data (id must be null)
     * @return 201 Created with the created parameter
     */
    @PostMapping
    public ResponseEntity<ParameterDTO> create(@Valid @RequestBody ParameterDTO dto) {
        ParameterDTO created = parameterService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Retrieves a single parameter by its code.
     *
     * @param code the parameter code
     * @return 200 OK with the parameter, or 404 if not found
     */
    @GetMapping("/{code}")
    public ResponseEntity<ParameterDTO> findByCode(@PathVariable String code) {
        ParameterDTO dto = parameterService.findByCode(code);
        return ResponseEntity.ok(dto);
    }

    /**
     * Updates an existing parameter identified by its code.
     *
     * @param code the parameter code
     * @param dto  the updated parameter data
     * @return 200 OK with the updated parameter, or 404 if not found
     */
    @PutMapping("/{code}")
    public ResponseEntity<ParameterDTO> update(@PathVariable String code, @Valid @RequestBody ParameterDTO dto) {
        ParameterDTO updated = parameterService.update(code, dto);
        return ResponseEntity.ok(updated);
    }

    /**
     * Deletes a parameter by its code.
     *
     * @param code the parameter code
     * @return 204 No Content on success, or 404 if not found
     */
    @DeleteMapping("/{code}")
    public ResponseEntity<Void> delete(@PathVariable String code) {
        parameterService.delete(code);
        return ResponseEntity.noContent().build();
    }

}
