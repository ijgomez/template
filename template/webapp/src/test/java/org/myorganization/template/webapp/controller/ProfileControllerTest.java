package org.myorganization.template.webapp.controller;

import java.time.OffsetDateTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.myorganization.template.core.service.ProfileService;
import org.myorganization.template.domain.criteria.ProfileCriteria;
import org.myorganization.template.domain.dto.ProfileDTO;
import org.myorganization.template.domain.exception.DuplicateEntityException;
import org.myorganization.template.domain.exception.EntityInUseException;
import org.myorganization.template.domain.exception.EntityNotFoundException;
import org.myorganization.template.domain.exception.ValidationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;

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
 * Unit tests for {@link ProfileController}.
 */
class ProfileControllerTest {

    private ProfileService profileService;
    private ProfileController profileController;

    @BeforeEach
    void setUp() {
        profileService = mock(ProfileService.class);
        profileController = new ProfileController(profileService);
    }

    @Test
    void findAll_shouldReturnPageOfProfiles() {
        Pageable pageable = PageRequest.of(0, 10);
        ProfileDTO dto = sampleProfile(1L);
        Page<ProfileDTO> page = new PageImpl<>(List.of(dto), pageable, 1);
        when(profileService.findByCriteria(any(ProfileCriteria.class), eq(pageable))).thenReturn(page);

        ResponseEntity<Page<ProfileDTO>> response = profileController.findAll(null, pageable);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getContent()).hasSize(1);
        assertThat(response.getBody().getContent().getFirst().name()).isEqualTo("Admin");
    }

    @Test
    void findAll_withNameFilter_shouldPassCriteriaToService() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<ProfileDTO> page = new PageImpl<>(List.of(), pageable, 0);
        when(profileService.findByCriteria(any(ProfileCriteria.class), eq(pageable))).thenReturn(page);

        ResponseEntity<Page<ProfileDTO>> response = profileController.findAll("Admin", pageable);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(profileService).findByCriteria(any(ProfileCriteria.class), eq(pageable));
    }

    @Test
    void count_shouldReturnTotalCount() {
        when(profileService.countByCriteria(any(ProfileCriteria.class))).thenReturn(5L);

        ResponseEntity<Long> response = profileController.count(null);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isEqualTo(5L);
    }

    @Test
    void count_withNameFilter_shouldPassCriteriaToService() {
        when(profileService.countByCriteria(any(ProfileCriteria.class))).thenReturn(2L);

        ResponseEntity<Long> response = profileController.count("Admin");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isEqualTo(2L);
    }

    @Test
    void create_shouldReturn201WithCreatedProfile() {
        ProfileDTO input = new ProfileDTO(null, "NewProfile", "Description", List.of(1L, 2L), null, null);
        ProfileDTO created = new ProfileDTO(1L, "NewProfile", "Description", List.of(1L, 2L),
                OffsetDateTime.now(), OffsetDateTime.now());
        when(profileService.create(input)).thenReturn(created);

        ResponseEntity<ProfileDTO> response = profileController.create(input);

        assertThat(response.getStatusCode().value()).isEqualTo(201);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().id()).isEqualTo(1L);
        assertThat(response.getBody().name()).isEqualTo("NewProfile");
        verify(profileService).create(input);
    }

    @Test
    void create_withDuplicateName_shouldThrowDuplicateEntityException() {
        ProfileDTO input = new ProfileDTO(null, "Admin", "Duplicate", List.of(), null, null);
        when(profileService.create(input)).thenThrow(new DuplicateEntityException("Profile", "name", "Admin"));

        assertThatThrownBy(() -> profileController.create(input))
                .isInstanceOf(DuplicateEntityException.class);
    }

    @Test
    void create_withDuplicateActions_shouldThrowValidationException() {
        ProfileDTO input = new ProfileDTO(null, "Test", "Desc", List.of(1L, 1L), null, null);
        when(profileService.create(input))
                .thenThrow(new ValidationException("The action list contains duplicates"));

        assertThatThrownBy(() -> profileController.create(input))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("duplicates");
    }

    @Test
    void findById_shouldReturnProfile() {
        ProfileDTO dto = sampleProfile(1L);
        when(profileService.findById(1L)).thenReturn(dto);

        ResponseEntity<ProfileDTO> response = profileController.findById(1L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().id()).isEqualTo(1L);
        assertThat(response.getBody().name()).isEqualTo("Admin");
    }

    @Test
    void findById_notFound_shouldThrowEntityNotFoundException() {
        when(profileService.findById(99L)).thenThrow(new EntityNotFoundException("Profile", 99L));

        assertThatThrownBy(() -> profileController.findById(99L))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void update_shouldReturnUpdatedProfile() {
        ProfileDTO input = new ProfileDTO(1L, "UpdatedProfile", "New desc", List.of(1L, 3L), null, null);
        ProfileDTO updated = new ProfileDTO(1L, "UpdatedProfile", "New desc", List.of(1L, 3L),
                OffsetDateTime.now(), OffsetDateTime.now());
        when(profileService.update(1L, input)).thenReturn(updated);

        ResponseEntity<ProfileDTO> response = profileController.update(1L, input);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().name()).isEqualTo("UpdatedProfile");
        verify(profileService).update(1L, input);
    }

    @Test
    void update_notFound_shouldThrowEntityNotFoundException() {
        ProfileDTO input = new ProfileDTO(99L, "Ghost", null, List.of(), null, null);
        when(profileService.update(99L, input)).thenThrow(new EntityNotFoundException("Profile", 99L));

        assertThatThrownBy(() -> profileController.update(99L, input))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void delete_shouldReturn204() {
        doNothing().when(profileService).delete(1L);

        ResponseEntity<Void> response = profileController.delete(1L);

        assertThat(response.getStatusCode().value()).isEqualTo(204);
        verify(profileService).delete(1L);
    }

    @Test
    void delete_notFound_shouldThrowEntityNotFoundException() {
        doThrow(new EntityNotFoundException("Profile", 99L)).when(profileService).delete(99L);

        assertThatThrownBy(() -> profileController.delete(99L))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void delete_profileInUse_shouldThrowEntityInUseException() {
        doThrow(new EntityInUseException("Profile", 1L)).when(profileService).delete(1L);

        assertThatThrownBy(() -> profileController.delete(1L))
                .isInstanceOf(EntityInUseException.class);
    }

    private ProfileDTO sampleProfile(Long id) {
        return new ProfileDTO(id, "Admin", "Administrator profile", List.of(1L, 2L, 3L),
                OffsetDateTime.now(), OffsetDateTime.now());
    }

}
