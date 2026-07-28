package org.myorganization.template.webapp.controller;

import java.time.OffsetDateTime;
import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.myorganization.template.core.service.UserService;
import org.myorganization.template.domain.criteria.UserCriteria;
import org.myorganization.template.domain.dto.UserDTO;
import org.myorganization.template.domain.exception.DuplicateEntityException;
import org.myorganization.template.domain.exception.EntityNotFoundException;
import org.myorganization.template.domain.exception.ValidationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link UserController}.
 */
class UserControllerTest {

    private UserService userService;
    private UserController userController;

    @BeforeEach
    void setUp() {
        userService = mock(UserService.class);
        userController = new UserController(userService);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void findAll_shouldReturnPageOfUsers() {
        Pageable pageable = PageRequest.of(0, 10);
        UserDTO dto = sampleUser(1L);
        Page<UserDTO> page = new PageImpl<>(List.of(dto), pageable, 1);
        when(userService.findByCriteria(any(UserCriteria.class), eq(pageable))).thenReturn(page);

        ResponseEntity<Page<UserDTO>> response = userController.findAll(null, null, null, null, null, pageable);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getContent()).hasSize(1);
        assertThat(response.getBody().getContent().getFirst().username()).isEqualTo("admin");
    }

    @Test
    void findAll_withFilters_shouldPassCriteriaToService() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<UserDTO> page = new PageImpl<>(List.of(), pageable, 0);
        when(userService.findByCriteria(any(UserCriteria.class), eq(pageable))).thenReturn(page);

        ResponseEntity<Page<UserDTO>> response = userController.findAll("admin", "John", "Doe", "john@mail.com", 1L, pageable);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(userService).findByCriteria(any(UserCriteria.class), eq(pageable));
    }

    @Test
    void count_shouldReturnTotalCount() {
        when(userService.countByCriteria(any(UserCriteria.class))).thenReturn(10L);

        ResponseEntity<Long> response = userController.count(null, null, null, null, null);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isEqualTo(10L);
    }

    @Test
    void count_withFilters_shouldPassCriteriaToService() {
        when(userService.countByCriteria(any(UserCriteria.class))).thenReturn(3L);

        ResponseEntity<Long> response = userController.count("admin", null, null, null, 2L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isEqualTo(3L);
    }

    @Test
    void create_shouldReturn201WithCreatedUser() {
        UserDTO input = new UserDTO(null, "newuser", "password", "New", "User", "new@mail.com",
                null, 1L, null, List.of(1L, 2L), null, null);
        UserDTO created = new UserDTO(1L, "newuser", null, "New", "User", "new@mail.com",
                null, 1L, "Admin", List.of(1L, 2L), OffsetDateTime.now(), OffsetDateTime.now());
        when(userService.create(input)).thenReturn(created);

        ResponseEntity<UserDTO> response = userController.create(input);

        assertThat(response.getStatusCode().value()).isEqualTo(201);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().id()).isEqualTo(1L);
        assertThat(response.getBody().username()).isEqualTo("newuser");
        verify(userService).create(input);
    }

    @Test
    void create_withDuplicateUsername_shouldThrowDuplicateEntityException() {
        UserDTO input = new UserDTO(null, "admin", "password", "A", "B", null,
                null, null, null, List.of(), null, null);
        when(userService.create(input)).thenThrow(new DuplicateEntityException("User", "username", "admin"));

        assertThatThrownBy(() -> userController.create(input))
                .isInstanceOf(DuplicateEntityException.class);
    }

    @Test
    void create_withDuplicateReports_shouldThrowValidationException() {
        UserDTO input = new UserDTO(null, "user1", "pass", "A", "B", null,
                null, null, null, List.of(1L, 1L), null, null);
        when(userService.create(input))
                .thenThrow(new ValidationException("Report list contains duplicates"));

        assertThatThrownBy(() -> userController.create(input))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("duplicates");
    }

    @Test
    void findById_shouldReturnUser() {
        UserDTO dto = sampleUser(1L);
        when(userService.findById(1L)).thenReturn(dto);

        ResponseEntity<UserDTO> response = userController.findById(1L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().id()).isEqualTo(1L);
        assertThat(response.getBody().username()).isEqualTo("admin");
    }

    @Test
    void findById_notFound_shouldThrowEntityNotFoundException() {
        when(userService.findById(99L)).thenThrow(new EntityNotFoundException("User", 99L));

        assertThatThrownBy(() -> userController.findById(99L))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void update_shouldReturnUpdatedUser() {
        UserDTO input = new UserDTO(1L, "admin", null, "Updated", "Name", "updated@mail.com",
                null, 2L, null, List.of(3L), null, null);
        UserDTO updated = new UserDTO(1L, "admin", null, "Updated", "Name", "updated@mail.com",
                null, 2L, "Editor", List.of(3L), OffsetDateTime.now(), OffsetDateTime.now());
        when(userService.update(1L, input)).thenReturn(updated);

        ResponseEntity<UserDTO> response = userController.update(1L, input);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().firstName()).isEqualTo("Updated");
        verify(userService).update(1L, input);
    }

    @Test
    void update_notFound_shouldThrowEntityNotFoundException() {
        UserDTO input = new UserDTO(99L, "ghost", null, "A", "B", null,
                null, null, null, List.of(), null, null);
        when(userService.update(99L, input)).thenThrow(new EntityNotFoundException("User", 99L));

        assertThatThrownBy(() -> userController.update(99L, input))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void delete_shouldReturn204() {
        doNothing().when(userService).delete(1L);

        ResponseEntity<Void> response = userController.delete(1L);

        assertThat(response.getStatusCode().value()).isEqualTo(204);
        verify(userService).delete(1L);
    }

    @Test
    void delete_notFound_shouldThrowEntityNotFoundException() {
        doThrow(new EntityNotFoundException("User", 99L)).when(userService).delete(99L);

        assertThatThrownBy(() -> userController.delete(99L))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void getMyProfile_shouldReturnCurrentUserProfile() {
        setAuthenticatedUser("admin");
        UserDTO dto = sampleUser(1L);
        when(userService.findByUsername("admin")).thenReturn(dto);

        ResponseEntity<UserDTO> response = userController.getMyProfile();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().username()).isEqualTo("admin");
        verify(userService).findByUsername("admin");
    }

    @Test
    void updateMyProfile_shouldUpdateOnlyPersonalFields() {
        setAuthenticatedUser("admin");
        UserDTO currentUser = sampleUser(1L);
        when(userService.findByUsername("admin")).thenReturn(currentUser);

        UserDTO input = new UserDTO(null, null, null, "NewFirst", "NewLast", "new@mail.com",
                null, null, null, null, null, null);
        UserDTO updated = new UserDTO(1L, "admin", null, "NewFirst", "NewLast", "new@mail.com",
                null, 1L, "Admin", List.of(1L), OffsetDateTime.now(), OffsetDateTime.now());
        when(userService.updateProfile(1L, input)).thenReturn(updated);

        ResponseEntity<UserDTO> response = userController.updateMyProfile(input);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().firstName()).isEqualTo("NewFirst");
        assertThat(response.getBody().lastName()).isEqualTo("NewLast");
        assertThat(response.getBody().email()).isEqualTo("new@mail.com");
        verify(userService).findByUsername("admin");
        verify(userService).updateProfile(1L, input);
    }

    private void setAuthenticatedUser(String username) {
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(username, null, List.of());
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private UserDTO sampleUser(Long id) {
        return new UserDTO(id, "admin", null, "Admin", "User", "admin@mail.com",
                OffsetDateTime.now(), 1L, "Admin", List.of(1L), OffsetDateTime.now(), OffsetDateTime.now());
    }

}
