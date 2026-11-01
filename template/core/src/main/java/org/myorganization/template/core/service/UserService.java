package org.myorganization.template.core.service;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

import org.myorganization.template.core.audit.Auditable;
import org.myorganization.template.core.repository.ProfileRepository;
import org.myorganization.template.core.repository.RefreshTokenRepository;
import org.myorganization.template.core.repository.ReportRepository;
import org.myorganization.template.core.repository.User2ReportRepository;
import org.myorganization.template.core.repository.UserRepository;
import org.myorganization.template.core.security.GrantAuthorityChecker;
import org.myorganization.template.domain.criteria.UserCriteria;
import org.myorganization.template.domain.dto.UserDTO;
import org.myorganization.template.domain.entity.Profile;
import org.myorganization.template.domain.entity.Report;
import org.myorganization.template.domain.entity.User;
import org.myorganization.template.domain.entity.User2Report;
import org.myorganization.template.domain.enums.AuditSection;
import org.myorganization.template.domain.enums.OperationType;
import org.myorganization.template.domain.exception.DuplicateEntityException;
import org.myorganization.template.domain.exception.EntityNotFoundException;
import org.myorganization.template.domain.exception.ValidationException;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Expression;

/**
 * Service handling user management operations: CRUD, criteria-based search, and self-service profile update.
 */
@Service
public class UserService extends AbstractCriteriaService<User, UserDTO, UserCriteria> {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final ReportRepository reportRepository;
    private final User2ReportRepository user2ReportRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       ProfileRepository profileRepository,
                       ReportRepository reportRepository,
                       User2ReportRepository user2ReportRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder) {
        super(userRepository);
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.reportRepository = reportRepository;
        this.user2ReportRepository = user2ReportRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Creates a new user with profile and report associations.
     * <p>
     * Validates unique username, hashes password with BCrypt, and persists
     * user2report associations without duplicates.
     *
     * @param dto the user data (id must be null)
     * @return the created user as DTO
     * @throws DuplicateEntityException if the username already exists
     * @throws ValidationException      if the report list contains duplicates
     */
    @Transactional
    @Auditable(operationType = OperationType.CREATE, section = AuditSection.SECURITY, entityName = "User")
    public UserDTO create(UserDTO dto) {
        validateRequiredCredentials(dto);
        validateNoDuplicateReports(dto.reportIds());
        requireGrantWhenAssigningProfile(dto.profileId());

        if (userRepository.existsByUsername(dto.username())) {
            throw new DuplicateEntityException("User", "username", dto.username());
        }

        User user = new User();
        user.setUsername(dto.username());
        user.setPassword(passwordEncoder.encode(dto.password()));
        user.setFirstName(dto.firstName());
        user.setLastName(dto.lastName());
        user.setEmail(dto.email());

        if (dto.profileId() != null) {
            Profile profile = profileRepository.findById(dto.profileId())
                    .orElseThrow(() -> new EntityNotFoundException("Profile", dto.profileId()));
            user.setProfile(profile);
        }

        User savedUser = userRepository.save(user);

        saveUserReportAssociations(savedUser, dto.reportIds());

        return toDTO(savedUser);
    }

    /**
     * Finds a user by identifier.
     *
     * @param id the user identifier
     * @return the user as DTO
     * @throws EntityNotFoundException if no user exists with the given id
     */
    @Transactional(readOnly = true)
    public UserDTO findById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User", id));
        return toDTO(user);
    }

    /**
     * Updates an existing user's data.
     * <p>
     * Updates: nombre, apellidos, email, perfil, reportes (no duplicates) and the lock
     * state. When {@code dto.locked()} is {@code true} the account is blocked indefinitely;
     * when it is {@code false} the account is unblocked, clearing both the administrator
     * block and any pending temporary lock.
     * Does NOT update: username, password, lastAccess.
     *
     * @param id  the user identifier
     * @param dto the updated user data
     * @return the updated user as DTO
     * @throws EntityNotFoundException if no user exists with the given id
     * @throws ValidationException     if the report list contains duplicates
     */
    @Transactional
    public UserDTO update(Long id, UserDTO dto) {
        validateNoDuplicateReports(dto.reportIds());

        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User", id));

        requireGrantIfProfileChange(user, dto.profileId());

        user.setFirstName(dto.firstName());
        user.setLastName(dto.lastName());
        user.setEmail(dto.email());
        applyLockState(user, dto.locked());

        if (dto.profileId() != null) {
            Profile profile = profileRepository.findById(dto.profileId())
                    .orElseThrow(() -> new EntityNotFoundException("Profile", dto.profileId()));
            user.setProfile(profile);
        } else {
            user.setProfile(null);
        }

        User savedUser = userRepository.save(user);

        // Replace report associations
        user2ReportRepository.deleteByIdUserId(id);
        user2ReportRepository.flush();
        saveUserReportAssociations(savedUser, dto.reportIds());

        return toDTO(savedUser);
    }

    /**
     * Deletes a user by identifier.
     *
     * @param id the user identifier
     * @throws EntityNotFoundException if no user exists with the given id
     */
    @Transactional
    public void delete(Long id) {
        if (!userRepository.existsById(id)) {
            throw new EntityNotFoundException("User", id);
        }
        refreshTokenRepository.deleteByUserId(id);
        user2ReportRepository.deleteByIdUserId(id);
        userRepository.deleteById(id);
    }

    /**
     * Finds a user by their username.
     *
     * @param username the username to search for
     * @return the user as DTO
     * @throws EntityNotFoundException if no user exists with the given username
     */
    @Transactional(readOnly = true)
    public UserDTO findByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("User not found with username: " + username));
        return toDTO(user);
    }

    /**
     * Self-service profile update. Only allows: nombre, apellidos, email.
     * <p>
     * Does NOT allow changes to profile or reports.
     *
     * @param userId the authenticated user's identifier
     * @param dto    the updated user data (only firstName, lastName, email are applied)
     * @return the updated user as DTO
     * @throws EntityNotFoundException if no user exists with the given id
     */
    @Transactional
    public UserDTO updateProfile(Long userId, UserDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId));

        user.setFirstName(dto.firstName());
        user.setLastName(dto.lastName());
        user.setEmail(dto.email());

        User savedUser = userRepository.save(user);
        return toDTO(savedUser);
    }

    // --- Private helpers ---

    /**
     * Segregación de funciones (SEC-07): asignar un perfil a un usuario equivale a
     * concederle los permisos de ese perfil, por lo que exige la autoridad
     * {@link GrantAuthorityChecker#USER_GRANT} además de {@code USER_WRITE}.
     *
     * @param profileId el perfil solicitado; {@code null} no concede nada
     */
    private void requireGrantWhenAssigningProfile(Long profileId) {
        if (profileId != null) {
            GrantAuthorityChecker.checkGrant(GrantAuthorityChecker.USER_GRANT);
        }
    }

    /**
     * Segregación de funciones (SEC-07): solo exige la autoridad
     * {@link GrantAuthorityChecker#USER_GRANT} si el perfil efectivamente cambia,
     * de modo que editar otros datos del usuario no requiere privilegios de concesión.
     *
     * @param user      el usuario actual
     * @param profileId el perfil solicitado
     */
    private void requireGrantIfProfileChange(User user, Long profileId) {
        Long currentProfileId = user.getProfile() != null ? user.getProfile().getId() : null;
        if (!Objects.equals(currentProfileId, profileId)) {
            GrantAuthorityChecker.checkGrant(GrantAuthorityChecker.USER_GRANT);
        }
    }

    /**
     * Defense-in-depth check for the credentials required on creation.
     * <p>
     * The controller enforces this via Bean Validation, but services are also
     * called from other code paths; guarding here avoids a
     * {@link NullPointerException}/500 when the username or password is missing.
     *
     * @param dto the user data
     * @throws ValidationException if username or password is missing
     */
    private void validateRequiredCredentials(UserDTO dto) {
        if (dto.username() == null) {
            throw new ValidationException("username is required");
        }
        if (dto.password() == null) {
            throw new ValidationException("password is required");
        }
    }

    /**
     * Applies the requested lock state to the account.
     * <p>
     * Blocking sets the administrator flag, which has no expiry. Unblocking clears both
     * that flag and any pending temporary lock, so a user locked after too many failed
     * logins can be released immediately. A {@code null} value (callers that do not manage
     * the lock state) leaves the account untouched.
     *
     * @param user   the user to update
     * @param locked the requested lock state, or {@code null} to leave it unchanged
     */
    private void applyLockState(User user, Boolean locked) {
        if (locked == null) {
            return;
        }
        user.setLocked(locked);
        if (!locked) {
            user.setLockedUntil(null);
            user.setFailedLoginAttempts(0);
        }
    }

    private void validateNoDuplicateReports(List<Long> reportIds) {
        if (reportIds == null || reportIds.isEmpty()) {
            return;
        }
        Set<Long> uniqueIds = new HashSet<>(reportIds);
        if (uniqueIds.size() < reportIds.size()) {
            throw new ValidationException("Report list contains duplicates");
        }
    }

    private void saveUserReportAssociations(User user, List<Long> reportIds) {
        if (reportIds == null || reportIds.isEmpty()) {
            return;
        }
        for (Long reportId : reportIds) {
            Report report = reportRepository.findById(reportId)
                    .orElseThrow(() -> new EntityNotFoundException("Report", reportId));
            User2Report association = new User2Report(user, report);
            user2ReportRepository.save(association);
        }
    }

    @Override
    protected Specification<User> buildSpecification(UserCriteria criteria) {
        Specification<User> spec = (root, query, cb) -> cb.conjunction();

        if (criteria.username() != null && !criteria.username().isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("username")), "%" + criteria.username().toLowerCase() + "%"));
        }

        if (criteria.firstName() != null && !criteria.firstName().isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("firstName")), "%" + criteria.firstName().toLowerCase() + "%"));
        }

        if (criteria.lastName() != null && !criteria.lastName().isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("lastName")), "%" + criteria.lastName().toLowerCase() + "%"));
        }

        if (criteria.email() != null && !criteria.email().isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("email")), "%" + criteria.email().toLowerCase() + "%"));
        }

        if (criteria.profileId() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("profile").get("id"), criteria.profileId()));
        }

        if (criteria.locked() != null) {
            spec = spec.and((root, query, cb) -> {
                OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
                Expression<Boolean> administratorLock = root.get("locked");
                Expression<OffsetDateTime> lockedUntil = root.get("lockedUntil");

                if (Boolean.TRUE.equals(criteria.locked())) {
                    return cb.or(
                            cb.isTrue(administratorLock),
                            cb.greaterThan(lockedUntil, now));
                }
                // Unlocked: no administrator lock and no active temporary lock window.
                return cb.and(
                        cb.isFalse(administratorLock),
                        cb.or(cb.isNull(lockedUntil), cb.lessThanOrEqualTo(lockedUntil, now)));
            });
        }

        return spec;
    }

    @Override
    protected UserDTO toDTO(User user) {
        List<Long> reportIds = user.getUserReports().stream()
                .map(ur -> ur.getReport().getId())
                .toList();

        String profileName = user.getProfile() != null ? user.getProfile().getName() : null;
        Long profileId = user.getProfile() != null ? user.getProfile().getId() : null;

        return new UserDTO(
                user.getId(),
                user.getUsername(),
                null, // Never expose password
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getLastAccess(),
                profileId,
                profileName,
                reportIds,
                user.getCreatedAt(),
                user.getLastModifiedAt(),
                user.isCurrentlyLocked()
        );
    }
}
