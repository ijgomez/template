package org.myorganization.template.core.service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.myorganization.template.core.repository.ActionRepository;
import org.myorganization.template.core.repository.Profile2ActionRepository;
import org.myorganization.template.core.repository.ProfileRepository;
import org.myorganization.template.domain.criteria.ProfileCriteria;
import org.myorganization.template.domain.dto.ProfileDTO;
import org.myorganization.template.domain.entity.Action;
import org.myorganization.template.domain.entity.Profile;
import org.myorganization.template.domain.entity.Profile2Action;
import org.myorganization.template.domain.entity.Profile2ActionPK;
import org.myorganization.template.domain.entity.User;
import org.myorganization.template.domain.exception.DuplicateEntityException;
import org.myorganization.template.domain.exception.EntityInUseException;
import org.myorganization.template.domain.exception.EntityNotFoundException;
import org.myorganization.template.domain.exception.ValidationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProfileServiceTest {

    @Mock
    private ProfileRepository profileRepository;

    @Mock
    private Profile2ActionRepository profile2ActionRepository;

    @Mock
    private ActionRepository actionRepository;

    private ProfileService profileService;

    @BeforeEach
    void setUp() {
        profileService = new ProfileService(profileRepository, profile2ActionRepository, actionRepository);
    }

    // --- create ---

    @Test
    @DisplayName("create: valid profile without actions returns created ProfileDTO")
    void create_validProfileWithoutActions_returnsCreatedDTO() {
        ProfileDTO dto = new ProfileDTO(null, "ADMIN", "Administrator profile", List.of(), null, null);

        when(profileRepository.existsByName("ADMIN")).thenReturn(false);
        Profile savedProfile = createProfileEntity(1L, "ADMIN", "Administrator profile");
        when(profileRepository.save(any(Profile.class))).thenReturn(savedProfile);

        ProfileDTO result = profileService.create(dto);

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.name()).isEqualTo("ADMIN");
        assertThat(result.description()).isEqualTo("Administrator profile");
        assertThat(result.actionIds()).isEmpty();
        verify(profileRepository).save(any(Profile.class));
    }

    @Test
    @DisplayName("create: valid profile with actions persists associations")
    void create_validProfileWithActions_persistsAssociations() {
        ProfileDTO dto = new ProfileDTO(null, "EDITOR", "Editor profile", List.of(10L, 20L), null, null);

        when(profileRepository.existsByName("EDITOR")).thenReturn(false);
        Profile savedProfile = createProfileEntity(2L, "EDITOR", "Editor profile");
        when(profileRepository.save(any(Profile.class))).thenReturn(savedProfile);

        Action action1 = createActionEntity(10L);
        Action action2 = createActionEntity(20L);
        when(actionRepository.findById(10L)).thenReturn(Optional.of(action1));
        when(actionRepository.findById(20L)).thenReturn(Optional.of(action2));
        when(profile2ActionRepository.save(any(Profile2Action.class))).thenReturn(new Profile2Action());

        ProfileDTO result = profileService.create(dto);

        assertThat(result.id()).isEqualTo(2L);
        assertThat(result.actionIds()).containsExactly(10L, 20L);
        verify(profile2ActionRepository, org.mockito.Mockito.times(2)).save(any(Profile2Action.class));
    }

    @Test
    @DisplayName("create: duplicate name throws DuplicateEntityException")
    void create_duplicateName_throwsDuplicateEntityException() {
        ProfileDTO dto = new ProfileDTO(null, "ADMIN", "desc", List.of(), null, null);
        when(profileRepository.existsByName("ADMIN")).thenReturn(true);

        assertThatThrownBy(() -> profileService.create(dto))
                .isInstanceOf(DuplicateEntityException.class)
                .hasMessageContaining("ADMIN");

        verify(profileRepository, never()).save(any());
    }

    @Test
    @DisplayName("create: duplicate actions in list throws ValidationException")
    void create_duplicateActions_throwsValidationException() {
        ProfileDTO dto = new ProfileDTO(null, "TEST", "desc", List.of(1L, 2L, 1L), null, null);

        assertThatThrownBy(() -> profileService.create(dto))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("duplicates");

        verify(profileRepository, never()).save(any());
    }

    @Test
    @DisplayName("create: non-existent action throws EntityNotFoundException")
    void create_nonExistentAction_throwsEntityNotFoundException() {
        ProfileDTO dto = new ProfileDTO(null, "TEST", "desc", List.of(99L), null, null);

        when(profileRepository.existsByName("TEST")).thenReturn(false);
        Profile savedProfile = createProfileEntity(1L, "TEST", "desc");
        when(profileRepository.save(any(Profile.class))).thenReturn(savedProfile);
        when(actionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> profileService.create(dto))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Action");
    }

    // --- findById ---

    @Test
    @DisplayName("findById: existing profile returns ProfileDTO with actions")
    void findById_existingProfile_returnsProfileDTOWithActions() {
        Profile profile = createProfileEntity(1L, "ADMIN", "Admin");
        when(profileRepository.findById(1L)).thenReturn(Optional.of(profile));

        Profile2Action p2a = new Profile2Action();
        p2a.setId(new Profile2ActionPK(1L, 5L));
        when(profile2ActionRepository.findByIdProfileId(1L)).thenReturn(List.of(p2a));

        ProfileDTO result = profileService.findById(1L);

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.name()).isEqualTo("ADMIN");
        assertThat(result.actionIds()).containsExactly(5L);
    }

    @Test
    @DisplayName("findById: non-existent profile throws EntityNotFoundException")
    void findById_nonExistent_throwsEntityNotFoundException() {
        when(profileRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> profileService.findById(999L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Profile");
    }

    // --- findByCriteria ---

    @Test
    @DisplayName("findByCriteria: returns paginated profiles")
    @SuppressWarnings("unchecked")
    void findByCriteria_returnsPagedProfiles() {
        Profile profile = createProfileEntity(1L, "ADMIN", "Admin");
        Pageable pageable = PageRequest.of(0, 10);
        Page<Profile> page = new PageImpl<>(List.of(profile), pageable, 1);

        when(profileRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
        when(profile2ActionRepository.findByIdProfileId(1L)).thenReturn(Collections.emptyList());

        ProfileCriteria criteria = new ProfileCriteria("ADMIN");
        Page<ProfileDTO> result = profileService.findByCriteria(criteria, pageable);

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().getFirst().name()).isEqualTo("ADMIN");
    }

    // --- countByCriteria ---

    @Test
    @DisplayName("countByCriteria: returns count of matching profiles")
    @SuppressWarnings("unchecked")
    void countByCriteria_returnsCount() {
        when(profileRepository.count(any(Specification.class))).thenReturn(5L);

        ProfileCriteria criteria = new ProfileCriteria("test");
        long count = profileService.countByCriteria(criteria);

        assertThat(count).isEqualTo(5L);
    }

    // --- update ---

    @Test
    @DisplayName("update: valid update changes name, description, and actions")
    void update_validUpdate_changesNameDescriptionActions() {
        Profile profile = createProfileEntity(1L, "OLD_NAME", "Old desc");
        when(profileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(profileRepository.existsByName("NEW_NAME")).thenReturn(false);
        when(profileRepository.save(any(Profile.class))).thenReturn(profile);
        doNothing().when(profile2ActionRepository).deleteByIdProfileId(1L);

        Action action = createActionEntity(10L);
        when(actionRepository.findById(10L)).thenReturn(Optional.of(action));
        when(profile2ActionRepository.save(any(Profile2Action.class))).thenReturn(new Profile2Action());

        ProfileDTO dto = new ProfileDTO(1L, "NEW_NAME", "New desc", List.of(10L), null, null);
        ProfileDTO result = profileService.update(1L, dto);

        assertThat(result.name()).isEqualTo("NEW_NAME");
        assertThat(result.actionIds()).containsExactly(10L);
        verify(profile2ActionRepository).deleteByIdProfileId(1L);
    }

    @Test
    @DisplayName("update: same name does not trigger uniqueness check")
    void update_sameName_noUniquenessCheck() {
        Profile profile = createProfileEntity(1L, "SAME_NAME", "desc");
        when(profileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(profileRepository.save(any(Profile.class))).thenReturn(profile);
        doNothing().when(profile2ActionRepository).deleteByIdProfileId(1L);

        ProfileDTO dto = new ProfileDTO(1L, "SAME_NAME", "new desc", List.of(), null, null);
        ProfileDTO result = profileService.update(1L, dto);

        assertThat(result.description()).isEqualTo("new desc");
        verify(profileRepository, never()).existsByName("SAME_NAME");
    }

    @Test
    @DisplayName("update: conflicting name throws DuplicateEntityException")
    void update_conflictingName_throwsDuplicateEntityException() {
        Profile profile = createProfileEntity(1L, "OLD_NAME", "desc");
        when(profileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(profileRepository.existsByName("TAKEN_NAME")).thenReturn(true);

        ProfileDTO dto = new ProfileDTO(1L, "TAKEN_NAME", "desc", List.of(), null, null);

        assertThatThrownBy(() -> profileService.update(1L, dto))
                .isInstanceOf(DuplicateEntityException.class)
                .hasMessageContaining("TAKEN_NAME");
    }

    @Test
    @DisplayName("update: non-existent profile throws EntityNotFoundException")
    void update_nonExistentProfile_throwsEntityNotFoundException() {
        when(profileRepository.findById(999L)).thenReturn(Optional.empty());

        ProfileDTO dto = new ProfileDTO(999L, "NAME", "desc", List.of(), null, null);

        assertThatThrownBy(() -> profileService.update(999L, dto))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Profile");
    }

    @Test
    @DisplayName("update: duplicate actions throws ValidationException")
    void update_duplicateActions_throwsValidationException() {
        ProfileDTO dto = new ProfileDTO(1L, "NAME", "desc", List.of(1L, 1L), null, null);

        assertThatThrownBy(() -> profileService.update(1L, dto))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("duplicates");
    }

    // --- delete ---

    @Test
    @DisplayName("delete: profile without users is deleted successfully")
    void delete_profileWithoutUsers_deletedSuccessfully() {
        Profile profile = createProfileEntity(1L, "ADMIN", "desc");
        profile.setUsers(Collections.emptyList());
        when(profileRepository.findById(1L)).thenReturn(Optional.of(profile));
        doNothing().when(profile2ActionRepository).deleteByIdProfileId(1L);

        profileService.delete(1L);

        verify(profile2ActionRepository).deleteByIdProfileId(1L);
        verify(profileRepository).delete(profile);
    }

    @Test
    @DisplayName("delete: profile with assigned users throws EntityInUseException")
    void delete_profileWithUsers_throwsEntityInUseException() {
        Profile profile = createProfileEntity(1L, "ADMIN", "desc");
        profile.setUsers(List.of(new User()));
        when(profileRepository.findById(1L)).thenReturn(Optional.of(profile));

        assertThatThrownBy(() -> profileService.delete(1L))
                .isInstanceOf(EntityInUseException.class)
                .hasMessageContaining("Profile");

        verify(profileRepository, never()).deleteById(any(Long.class));
    }

    @Test
    @DisplayName("delete: non-existent profile throws EntityNotFoundException")
    void delete_nonExistentProfile_throwsEntityNotFoundException() {
        when(profileRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> profileService.delete(999L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Profile");
    }

    // --- Helper methods ---

    private Profile createProfileEntity(Long id, String name, String description) {
        Profile profile = new Profile();
        profile.setId(id);
        profile.setName(name);
        profile.setDescription(description);
        profile.setUsers(Collections.emptyList());
        return profile;
    }

    private Action createActionEntity(Long id) {
        Action action = new Action();
        action.setId(id);
        action.setCode("ACTION_" + id);
        return action;
    }
}
