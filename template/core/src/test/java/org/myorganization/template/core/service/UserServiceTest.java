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
import org.myorganization.template.core.repository.ProfileRepository;
import org.myorganization.template.core.repository.ReportRepository;
import org.myorganization.template.core.repository.User2ReportRepository;
import org.myorganization.template.core.repository.UserRepository;
import org.myorganization.template.domain.criteria.UserCriteria;
import org.myorganization.template.domain.dto.UserDTO;
import org.myorganization.template.domain.entity.Profile;
import org.myorganization.template.domain.entity.Report;
import org.myorganization.template.domain.entity.User;
import org.myorganization.template.domain.entity.User2Report;
import org.myorganization.template.domain.exception.DuplicateEntityException;
import org.myorganization.template.domain.exception.EntityNotFoundException;
import org.myorganization.template.domain.exception.ValidationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProfileRepository profileRepository;

    @Mock
    private ReportRepository reportRepository;

    @Mock
    private User2ReportRepository user2ReportRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository, profileRepository, reportRepository,
                user2ReportRepository, passwordEncoder);
    }

    // --- create ---

    @Test
    @DisplayName("create: valid user without reports returns created user DTO")
    void create_validUserNoReports_returnsDTO() {
        UserDTO dto = new UserDTO(null, "john", "secret", "John", "Doe",
                "john@test.com", null, 1L, null, Collections.emptyList(), null, null);

        Profile profile = new Profile();
        profile.setId(1L);
        profile.setName("ADMIN");

        User savedUser = createUserEntity(1L, "john", "John", "Doe", "john@test.com", profile);

        when(userRepository.existsByUsername("john")).thenReturn(false);
        when(passwordEncoder.encode("secret")).thenReturn("$2a$12$encoded");
        when(profileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        UserDTO result = userService.create(dto);

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.username()).isEqualTo("john");
        assertThat(result.password()).isNull();
        assertThat(result.firstName()).isEqualTo("John");
        assertThat(result.profileName()).isEqualTo("ADMIN");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("create: valid user with reports persists user2report associations")
    void create_validUserWithReports_persistsAssociations() {
        UserDTO dto = new UserDTO(null, "jane", "pass", "Jane", "Smith",
                "jane@test.com", null, null, null, List.of(10L, 20L), null, null);

        User savedUser = createUserEntity(2L, "jane", "Jane", "Smith", "jane@test.com", null);

        Report report1 = new Report();
        report1.setId(10L);
        Report report2 = new Report();
        report2.setId(20L);

        when(userRepository.existsByUsername("jane")).thenReturn(false);
        when(passwordEncoder.encode("pass")).thenReturn("$2a$12$encoded");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(reportRepository.findById(10L)).thenReturn(Optional.of(report1));
        when(reportRepository.findById(20L)).thenReturn(Optional.of(report2));
        when(user2ReportRepository.save(any(User2Report.class))).thenAnswer(i -> i.getArgument(0));

        userService.create(dto);

        verify(user2ReportRepository, org.mockito.Mockito.times(2)).save(any(User2Report.class));
    }

    @Test
    @DisplayName("create: duplicate username throws DuplicateEntityException")
    void create_duplicateUsername_throwsDuplicateEntityException() {
        UserDTO dto = new UserDTO(null, "existing", "pass", null, null,
                null, null, null, null, Collections.emptyList(), null, null);

        when(userRepository.existsByUsername("existing")).thenReturn(true);

        assertThatThrownBy(() -> userService.create(dto))
                .isInstanceOf(DuplicateEntityException.class)
                .hasMessageContaining("username");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("create: duplicate reports throws ValidationException")
    void create_duplicateReports_throwsValidationException() {
        UserDTO dto = new UserDTO(null, "user1", "pass", null, null,
                null, null, null, null, List.of(1L, 2L, 1L), null, null);

        assertThatThrownBy(() -> userService.create(dto))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("duplicates");

        verify(userRepository, never()).save(any());
    }

    // --- findById ---

    @Test
    @DisplayName("findById: existing user returns DTO")
    void findById_existingUser_returnsDTO() {
        User user = createUserEntity(5L, "bob", "Bob", "Jones", "bob@test.com", null);
        when(userRepository.findById(5L)).thenReturn(Optional.of(user));

        UserDTO result = userService.findById(5L);

        assertThat(result.id()).isEqualTo(5L);
        assertThat(result.username()).isEqualTo("bob");
    }

    @Test
    @DisplayName("findById: non-existing user throws EntityNotFoundException")
    void findById_nonExisting_throwsEntityNotFoundException() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.findById(99L))
                .isInstanceOf(EntityNotFoundException.class);
    }

    // --- findByCriteria ---

    @Test
    @DisplayName("findByCriteria: returns paginated results")
    @SuppressWarnings("unchecked")
    void findByCriteria_returnsPaginatedResults() {
        UserCriteria criteria = new UserCriteria("john", null, null, null, null);
        Pageable pageable = PageRequest.of(0, 10);
        User user = createUserEntity(1L, "john", "John", "Doe", null, null);
        Page<User> page = new PageImpl<>(List.of(user), pageable, 1);

        when(userRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        Page<UserDTO> result = userService.findByCriteria(criteria, pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getTotalElements()).isEqualTo(1);
    }

    // --- countByCriteria ---

    @Test
    @DisplayName("countByCriteria: returns count of matching users")
    @SuppressWarnings("unchecked")
    void countByCriteria_returnsCount() {
        UserCriteria criteria = new UserCriteria(null, null, null, null, null);
        when(userRepository.count(any(Specification.class))).thenReturn(5L);

        long count = userService.countByCriteria(criteria);

        assertThat(count).isEqualTo(5L);
    }

    // --- update ---

    @Test
    @DisplayName("update: existing user updates fields and returns DTO")
    void update_existingUser_updatesAndReturnsDTO() {
        Profile profile = new Profile();
        profile.setId(2L);
        profile.setName("USER");

        User existingUser = createUserEntity(1L, "john", "John", "Doe", "john@test.com", null);

        UserDTO dto = new UserDTO(1L, "john", null, "Johnny", "Updated",
                "new@test.com", null, 2L, null, Collections.emptyList(), null, null);

        when(userRepository.findById(1L)).thenReturn(Optional.of(existingUser));
        when(profileRepository.findById(2L)).thenReturn(Optional.of(profile));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setProfile(profile);
            return u;
        });

        UserDTO result = userService.update(1L, dto);

        assertThat(result.firstName()).isEqualTo("Johnny");
        assertThat(result.lastName()).isEqualTo("Updated");
        assertThat(result.email()).isEqualTo("new@test.com");
        verify(user2ReportRepository).deleteByIdUserId(1L);
    }

    @Test
    @DisplayName("update: non-existing user throws EntityNotFoundException")
    void update_nonExisting_throwsEntityNotFoundException() {
        UserDTO dto = new UserDTO(99L, "user", null, null, null, null, null, null, null,
                Collections.emptyList(), null, null);

        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.update(99L, dto))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    @DisplayName("update: duplicate reports throws ValidationException")
    void update_duplicateReports_throwsValidationException() {
        UserDTO dto = new UserDTO(1L, "user", null, null, null, null, null, null, null,
                List.of(5L, 5L), null, null);

        assertThatThrownBy(() -> userService.update(1L, dto))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("duplicates");
    }

    // --- delete ---

    @Test
    @DisplayName("delete: existing user deletes successfully")
    void delete_existingUser_deletesSuccessfully() {
        when(userRepository.existsById(1L)).thenReturn(true);

        userService.delete(1L);

        verify(user2ReportRepository).deleteByIdUserId(1L);
        verify(userRepository).deleteById(1L);
    }

    @Test
    @DisplayName("delete: non-existing user throws EntityNotFoundException")
    void delete_nonExisting_throwsEntityNotFoundException() {
        when(userRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> userService.delete(99L))
                .isInstanceOf(EntityNotFoundException.class);

        verify(userRepository, never()).deleteById(anyLong());
    }

    // --- updateProfile ---

    @Test
    @DisplayName("updateProfile: updates only nombre, apellidos, email")
    void updateProfile_updatesOnlyAllowedFields() {
        Profile profile = new Profile();
        profile.setId(1L);
        profile.setName("ADMIN");

        User user = createUserEntity(1L, "john", "John", "Doe", "old@test.com", profile);

        UserDTO dto = new UserDTO(1L, "john", null, "Johnny", "NewLastName",
                "new@test.com", null, 99L, null, List.of(1L, 2L), null, null);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        UserDTO result = userService.updateProfile(1L, dto);

        assertThat(result.firstName()).isEqualTo("Johnny");
        assertThat(result.lastName()).isEqualTo("NewLastName");
        assertThat(result.email()).isEqualTo("new@test.com");
        // Profile should remain unchanged
        assertThat(result.profileId()).isEqualTo(1L);
        assertThat(result.profileName()).isEqualTo("ADMIN");
    }

    @Test
    @DisplayName("updateProfile: non-existing user throws EntityNotFoundException")
    void updateProfile_nonExisting_throwsEntityNotFoundException() {
        UserDTO dto = new UserDTO(99L, "user", null, "Name", null, null, null, null, null,
                null, null, null);

        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.updateProfile(99L, dto))
                .isInstanceOf(EntityNotFoundException.class);
    }

    // --- Helper methods ---

    private User createUserEntity(Long id, String username, String firstName, String lastName,
                                  String email, Profile profile) {
        User user = new User();
        user.setId(id);
        user.setUsername(username);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEmail(email);
        user.setProfile(profile);
        user.setUserReports(Collections.emptyList());
        return user;
    }
}
