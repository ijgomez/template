package org.myorganization.template.core.service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

import org.myorganization.template.core.repository.ParameterRepository;
import org.myorganization.template.domain.criteria.ParameterCriteria;
import org.myorganization.template.domain.dto.ParameterDTO;
import org.myorganization.template.domain.entity.Parameter;
import org.myorganization.template.domain.enums.ParameterType;
import org.myorganization.template.domain.exception.DuplicateEntityException;
import org.myorganization.template.domain.exception.EntityNotFoundException;
import org.myorganization.template.domain.exception.ValidationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for managing system parameters (CRUD operations).
 * <p>
 * Provides type-value validation ensuring that the parameter value
 * is compatible with its declared type (INTEGER, BOOLEAN, DATE, STRING).
 */
@Service
@Transactional
public class ParameterService {

    private final ParameterRepository parameterRepository;

    public ParameterService(ParameterRepository parameterRepository) {
        this.parameterRepository = parameterRepository;
    }

    /**
     * Creates a new system parameter.
     * <p>
     * Validates that the code is unique and that the value is compatible
     * with the declared type.
     *
     * @param dto the parameter data (id must be null)
     * @return the created parameter
     * @throws DuplicateEntityException if a parameter with the same code already exists
     * @throws ValidationException      if the value is incompatible with the type
     */
    public ParameterDTO create(ParameterDTO dto) {
        if (parameterRepository.existsByCode(dto.code())) {
            throw new DuplicateEntityException("Parameter", "code", dto.code());
        }

        validateTypeValueCompatibility(dto.type(), dto.value());

        Parameter entity = new Parameter();
        entity.setCode(dto.code());
        entity.setDescription(dto.description());
        entity.setValue(dto.value());
        entity.setType(dto.type());

        Parameter saved = parameterRepository.save(entity);
        return toDTO(saved);
    }

    /**
     * Finds a parameter by its unique code.
     *
     * @param code the parameter code
     * @return the parameter DTO
     * @throws EntityNotFoundException if no parameter with the given code exists
     */
    @Transactional(readOnly = true)
    public ParameterDTO findByCode(String code) {
        Parameter entity = parameterRepository.findByCode(code)
                .orElseThrow(() -> new EntityNotFoundException("Parameter", code));
        return toDTO(entity);
    }

    /**
     * Finds parameters matching the given criteria with pagination.
     *
     * @param criteria filter criteria (code, description, type)
     * @param pageable pagination information
     * @return a page of matching parameters
     */
    @Transactional(readOnly = true)
    public Page<ParameterDTO> findByCriteria(ParameterCriteria criteria, Pageable pageable) {
        Specification<Parameter> spec = buildSpecification(criteria);
        return parameterRepository.findAll(spec, pageable).map(this::toDTO);
    }

    /**
     * Counts parameters matching the given criteria.
     *
     * @param criteria filter criteria (code, description, type)
     * @return total count of matching parameters
     */
    @Transactional(readOnly = true)
    public long countByCriteria(ParameterCriteria criteria) {
        Specification<Parameter> spec = buildSpecification(criteria);
        return parameterRepository.count(spec);
    }

    /**
     * Updates an existing parameter identified by code.
     * <p>
     * Validates that the new value is compatible with the (potentially new) type.
     * Updates description, value, and type fields.
     *
     * @param code the parameter code identifying the entity
     * @param dto  the updated parameter data
     * @return the updated parameter
     * @throws EntityNotFoundException if no parameter with the given code exists
     * @throws ValidationException     if the value is incompatible with the type
     */
    public ParameterDTO update(String code, ParameterDTO dto) {
        Parameter entity = parameterRepository.findByCode(code)
                .orElseThrow(() -> new EntityNotFoundException("Parameter", code));

        validateTypeValueCompatibility(dto.type(), dto.value());

        entity.setDescription(dto.description());
        entity.setValue(dto.value());
        entity.setType(dto.type());

        Parameter saved = parameterRepository.save(entity);
        return toDTO(saved);
    }

    /**
     * Deletes a parameter by its code.
     *
     * @param code the parameter code
     * @throws EntityNotFoundException if no parameter with the given code exists
     */
    public void delete(String code) {
        Parameter entity = parameterRepository.findByCode(code)
                .orElseThrow(() -> new EntityNotFoundException("Parameter", code));
        parameterRepository.delete(entity);
    }

    /**
     * Validates that the given value is compatible with the declared parameter type.
     * <ul>
     *   <li>INTEGER: value must be parseable as an integer ({@link Integer#parseInt})</li>
     *   <li>BOOLEAN: value must be exactly "true" or "false"</li>
     *   <li>DATE: value must be a valid ISO 8601 date or datetime</li>
     *   <li>STRING: any value is valid</li>
     * </ul>
     *
     * @param type  the declared parameter type
     * @param value the value to validate
     * @throws ValidationException if the value is incompatible with the type
     */
    void validateTypeValueCompatibility(ParameterType type, String value) {
        if (type == null || value == null) {
            return;
        }

        switch (type) {
            case INTEGER -> {
                try {
                    Integer.parseInt(value);
                } catch (NumberFormatException e) {
                    throw new ValidationException(
                            "Value '" + value + "' is not a valid integer for type INTEGER");
                }
            }
            case BOOLEAN -> {
                if (!"true".equals(value) && !"false".equals(value)) {
                    throw new ValidationException(
                            "Value '" + value + "' is not valid for type BOOLEAN. Must be 'true' or 'false'");
                }
            }
            case DATE -> {
                if (!isValidIso8601Date(value)) {
                    throw new ValidationException(
                            "Value '" + value + "' is not a valid ISO 8601 date for type DATE");
                }
            }
            case STRING -> {
                // Any value is valid for STRING type
            }
        }
    }

    private boolean isValidIso8601Date(String value) {
        // Try parsing as ISO 8601 date-time (e.g., 2024-01-15T10:30:00Z)
        try {
            OffsetDateTime.parse(value, DateTimeFormatter.ISO_OFFSET_DATE_TIME);
            return true;
        } catch (DateTimeParseException ignored) {
            // Fall through to try other formats
        }

        // Try parsing as ISO 8601 local date-time (e.g., 2024-01-15T10:30:00)
        try {
            java.time.LocalDateTime.parse(value, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            return true;
        } catch (DateTimeParseException ignored) {
            // Fall through to try date only
        }

        // Try parsing as ISO 8601 date (e.g., 2024-01-15)
        try {
            LocalDate.parse(value, DateTimeFormatter.ISO_LOCAL_DATE);
            return true;
        } catch (DateTimeParseException ignored) {
            return false;
        }
    }

    private Specification<Parameter> buildSpecification(ParameterCriteria criteria) {
        Specification<Parameter> spec = (root, query, cb) -> cb.conjunction();

        if (criteria.code() != null && !criteria.code().isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("code")), "%" + criteria.code().toLowerCase() + "%"));
        }

        if (criteria.description() != null && !criteria.description().isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("description")), "%" + criteria.description().toLowerCase() + "%"));
        }

        if (criteria.type() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("type"), criteria.type()));
        }

        return spec;
    }

    private ParameterDTO toDTO(Parameter entity) {
        return new ParameterDTO(
                entity.getId(),
                entity.getCode(),
                entity.getDescription(),
                entity.getValue(),
                entity.getType(),
                entity.getCreatedAt(),
                entity.getLastModifiedAt()
        );
    }
}
