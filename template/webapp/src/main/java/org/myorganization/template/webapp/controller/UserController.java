package org.myorganization.template.webapp.controller;

import org.myorganization.template.core.service.UserService;
import org.myorganization.template.domain.criteria.UserCriteria;
import org.myorganization.template.domain.dto.UserDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for user management operations.
 * <p>
 * Exposes CRUD endpoints for user administration and self-service profile endpoints
 * for the authenticated user ({@code /me}).
 */
@RestController
@RequestMapping("/api/v1/administration/security/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Lists users with pagination and optional filters.
     *
     * @param username  filter by username (partial match)
     * @param firstName filter by first name (partial match)
     * @param lastName  filter by last name (partial match)
     * @param email     filter by email (partial match)
     * @param profileId filter by profile identifier
     * @param pageable  pagination parameters (page, size, sort)
     * @return 200 OK with paginated user list
     */
    @GetMapping
    public ResponseEntity<Page<UserDTO>> findAll(
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String firstName,
            @RequestParam(required = false) String lastName,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) Long profileId,
            Pageable pageable) {

        UserCriteria criteria = new UserCriteria(username, firstName, lastName, email, profileId);
        Page<UserDTO> page = userService.findByCriteria(criteria, pageable);
        return ResponseEntity.ok(page);
    }

    /**
     * Counts users matching the given filters.
     *
     * @param username  filter by username (partial match)
     * @param firstName filter by first name (partial match)
     * @param lastName  filter by last name (partial match)
     * @param email     filter by email (partial match)
     * @param profileId filter by profile identifier
     * @return 200 OK with the total count
     */
    @GetMapping("/count")
    public ResponseEntity<Long> count(
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String firstName,
            @RequestParam(required = false) String lastName,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) Long profileId) {

        UserCriteria criteria = new UserCriteria(username, firstName, lastName, email, profileId);
        long count = userService.countByCriteria(criteria);
        return ResponseEntity.ok(count);
    }

    /**
     * Creates a new user.
     *
     * @param dto the user data (id must be null)
     * @return 201 Created with the created user
     */
    @PostMapping
    public ResponseEntity<UserDTO> create(@RequestBody UserDTO dto) {
        UserDTO created = userService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Retrieves a user by identifier.
     *
     * @param id the user identifier
     * @return 200 OK with the user data
     */
    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> findById(@PathVariable Long id) {
        UserDTO user = userService.findById(id);
        return ResponseEntity.ok(user);
    }

    /**
     * Updates an existing user.
     *
     * @param id  the user identifier
     * @param dto the updated user data
     * @return 200 OK with the updated user
     */
    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> update(@PathVariable Long id, @RequestBody UserDTO dto) {
        UserDTO updated = userService.update(id, dto);
        return ResponseEntity.ok(updated);
    }

    /**
     * Deletes a user by identifier.
     *
     * @param id the user identifier
     * @return 204 No Content
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Retrieves the authenticated user's profile.
     *
     * @return 200 OK with the current user's data
     */
    @GetMapping("/me")
    public ResponseEntity<UserDTO> getMyProfile() {
        String username = getAuthenticatedUsername();
        UserDTO user = userService.findByUsername(username);
        return ResponseEntity.ok(user);
    }

    /**
     * Updates the authenticated user's profile (nombre, apellidos, email only).
     *
     * @param dto the updated profile data
     * @return 200 OK with the updated user data
     */
    @PutMapping("/me")
    public ResponseEntity<UserDTO> updateMyProfile(@RequestBody UserDTO dto) {
        String username = getAuthenticatedUsername();
        UserDTO currentUser = userService.findByUsername(username);
        UserDTO updated = userService.updateProfile(currentUser.id(), dto);
        return ResponseEntity.ok(updated);
    }

    /**
     * Extracts the authenticated username from the Spring Security context.
     *
     * @return the authenticated username
     */
    private String getAuthenticatedUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication.getName();
    }

}
