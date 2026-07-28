package org.myorganization.template.core.service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.myorganization.template.core.repository.ActionRepository;
import org.myorganization.template.core.repository.Profile2ActionRepository;
import org.myorganization.template.core.repository.ProfileRepository;
import org.myorganization.template.domain.criteria.ProfileCriteria;
import org.myorganization.template.domain.dto.ProfileDTO;
import org.myorganization.template.domain.entity.Action;
import org.myorganization.template.domain.entity.Profile;
import org.myorganization.template.domain.entity.Profile2Action;
import org.myorganization.template.domain.exception.DuplicateEntityException;
import org.myorganization.template.domain.exception.EntityInUseException;
import org.myorganization.template.domain.exception.EntityNotFoundException;
import org.myorganization.template.domain.exception.ValidationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service handling profile CRUD operations including action associations.
 */
@Service
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final Profile2ActionRepository profile2ActionRepository;
    private final ActionRepository actionRepository;

    public ProfileService(ProfileRepository profileRepository,
                          Profile2ActionRepository profile2ActionRepository,
                          ActionRepository actionRepository) {
        this.profileRepository = profileRepository;
        this.profile2ActionRepository = profile2ActionRepository;
        this.actionRepository = actionRepository;
    }

    /**
     * Creates a new profile with its associated actions.
     *
     * @param dto the profile data (id must be null)
     * @return the created ProfileDTO with generated id
     * @throws DuplicateEntityException if a profile with the same name already exists
     * @throws ValidationException      if the action list contains duplicates
     */
    @Transactional
    public ProfileDTO create(ProfileDTO dto) {
        validateNoDuplicateActions(dto.actionIds());

        if (profileRepository.existsByName(dto.name())) {
            throw new DuplicateEntityException("Profile", "name", dto.name());
        }

        Profile profile = new Profile();
        profile.setName(dto.name());
        profile.setDescription(dto.description());
        Profile savedProfile = profileRepository.save(profile);

        saveProfileActions(savedProfile, dto.actionIds());

        return toDTO(savedProfile, dto.actionIds());
    }

    /**
     * Finds a profile by its identifier, including the list of assigned actions.
     *
     * @param id the profile identifier
     * @return the ProfileDTO
     * @throws EntityNotFoundException if the profile is not found
     */
    @Transactional(readOnly = true)
    public ProfileDTO findById(Long id) {
        Profile profile = profileRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Profile", id));

        List<Long> actionIds = profile2ActionRepository.findByIdProfileId(id).stream()
                .map(p2a -> p2a.getId().getActionId())
                .toList();

        return toDTO(profile, actionIds);
    }

    /**
     * Searches profiles with pagination and filtering by criteria.
     *
     * @param criteria the filter criteria
     * @param pageable pagination information
     * @return a page of ProfileDTO
     */
    @Transactional(readOnly = true)
    public Page<ProfileDTO> findByCriteria(ProfileCriteria criteria, Pageable pageable) {
        Specification<Profile> spec = buildSpecification(criteria);
        return profileRepository.findAll(spec, pageable)
                .map(profile -> {
                    List<Long> actionIds = profile2ActionRepository.findByIdProfileId(profile.getId()).stream()
                            .map(p2a -> p2a.getId().getActionId())
                            .toList();
                    return toDTO(profile, actionIds);
                });
    }

    /**
     * Counts profiles matching the given criteria.
     *
     * @param criteria the filter criteria
     * @return the total count of matching profiles
     */
    @Transactional(readOnly = true)
    public long countByCriteria(ProfileCriteria criteria) {
        Specification<Profile> spec = buildSpecification(criteria);
        return profileRepository.count(spec);
    }

    /**
     * Updates an existing profile: name, description and action associations.
     *
     * @param id  the profile identifier
     * @param dto the updated profile data
     * @return the updated ProfileDTO
     * @throws EntityNotFoundException  if the profile is not found
     * @throws DuplicateEntityException if the new name conflicts with another profile
     * @throws ValidationException      if the action list contains duplicates
     */
    @Transactional
    public ProfileDTO update(Long id, ProfileDTO dto) {
        validateNoDuplicateActions(dto.actionIds());

        Profile profile = profileRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Profile", id));

        // Check name uniqueness only if the name has changed
        if (!profile.getName().equals(dto.name()) && profileRepository.existsByName(dto.name())) {
            throw new DuplicateEntityException("Profile", "name", dto.name());
        }

        profile.setName(dto.name());
        profile.setDescription(dto.description());
        Profile savedProfile = profileRepository.save(profile);

        // Replace action associations
        profile2ActionRepository.deleteByIdProfileId(id);
        profile2ActionRepository.flush();
        saveProfileActions(savedProfile, dto.actionIds());

        return toDTO(savedProfile, dto.actionIds());
    }

    /**
     * Deletes a profile by its identifier.
     * Fails with 409 if the profile has assigned users.
     *
     * @param id the profile identifier
     * @throws EntityNotFoundException if the profile is not found
     * @throws EntityInUseException    if the profile has assigned users
     */
    @Transactional
    public void delete(Long id) {
        Profile profile = profileRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Profile", id));

        if (profile.getUsers() != null && !profile.getUsers().isEmpty()) {
            throw new EntityInUseException("Profile", id);
        }

        profile2ActionRepository.deleteByIdProfileId(id);
        profileRepository.delete(profile);
    }

    // --- Private helper methods ---

    private void validateNoDuplicateActions(List<Long> actionIds) {
        if (actionIds == null || actionIds.isEmpty()) {
            return;
        }
        Set<Long> uniqueIds = new HashSet<>(actionIds);
        if (uniqueIds.size() != actionIds.size()) {
            throw new ValidationException("The action list contains duplicates");
        }
    }

    private void saveProfileActions(Profile profile, List<Long> actionIds) {
        if (actionIds == null || actionIds.isEmpty()) {
            return;
        }
        for (Long actionId : actionIds) {
            Action action = actionRepository.findById(actionId)
                    .orElseThrow(() -> new EntityNotFoundException("Action", actionId));
            Profile2Action p2a = new Profile2Action(profile, action);
            profile2ActionRepository.save(p2a);
        }
    }

    private Specification<Profile> buildSpecification(ProfileCriteria criteria) {
        Specification<Profile> spec = (root, query, cb) -> cb.conjunction();
        if (criteria != null && criteria.name() != null && !criteria.name().isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("name")), "%" + criteria.name().toLowerCase() + "%"));
        }
        return spec;
    }

    private ProfileDTO toDTO(Profile profile, List<Long> actionIds) {
        return new ProfileDTO(
                profile.getId(),
                profile.getName(),
                profile.getDescription(),
                actionIds != null ? actionIds : List.of(),
                profile.getCreatedAt(),
                profile.getLastModifiedAt()
        );
    }
}
