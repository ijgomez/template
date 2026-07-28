package org.myorganization.template.webapp.controller;

import org.myorganization.template.core.service.ProfileService;
import org.myorganization.template.domain.criteria.ProfileCriteria;
import org.myorganization.template.domain.dto.ProfileDTO;
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
 * REST controller for profile management.
 * <p>
 * Exposes CRUD endpoints for profiles at
 * {@code /api/v1/administration/security/profiles}.
 */
@RestController
@RequestMapping("/api/v1/administration/security/profiles")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    /**
     * Lists profiles with pagination and optional filtering.
     *
     * @param name     optional filter by profile name (partial match)
     * @param pageable pagination parameters (page, size, sort)
     * @return a page of ProfileDTO
     */
    @GetMapping
    public ResponseEntity<Page<ProfileDTO>> findAll(
            @RequestParam(required = false) String name,
            Pageable pageable) {
        ProfileCriteria criteria = new ProfileCriteria(name);
        Page<ProfileDTO> page = profileService.findByCriteria(criteria, pageable);
        return ResponseEntity.ok(page);
    }

    /**
     * Counts profiles matching the given filter criteria.
     *
     * @param name optional filter by profile name (partial match)
     * @return the total count of matching profiles
     */
    @GetMapping("/count")
    public ResponseEntity<Long> count(@RequestParam(required = false) String name) {
        ProfileCriteria criteria = new ProfileCriteria(name);
        long total = profileService.countByCriteria(criteria);
        return ResponseEntity.ok(total);
    }

    /**
     * Creates a new profile.
     *
     * @param dto the profile data (id must be null)
     * @return 201 Created with the created ProfileDTO
     */
    @PostMapping
    public ResponseEntity<ProfileDTO> create(@Valid @RequestBody ProfileDTO dto) {
        ProfileDTO created = profileService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Retrieves a profile by its identifier.
     *
     * @param id the profile identifier
     * @return the ProfileDTO
     */
    @GetMapping("/{id}")
    public ResponseEntity<ProfileDTO> findById(@PathVariable Long id) {
        ProfileDTO dto = profileService.findById(id);
        return ResponseEntity.ok(dto);
    }

    /**
     * Updates an existing profile.
     *
     * @param id  the profile identifier
     * @param dto the updated profile data
     * @return the updated ProfileDTO
     */
    @PutMapping("/{id}")
    public ResponseEntity<ProfileDTO> update(@PathVariable Long id, @Valid @RequestBody ProfileDTO dto) {
        ProfileDTO updated = profileService.update(id, dto);
        return ResponseEntity.ok(updated);
    }

    /**
     * Deletes a profile by its identifier.
     *
     * @param id the profile identifier
     * @return 204 No Content
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        profileService.delete(id);
        return ResponseEntity.noContent().build();
    }

}
