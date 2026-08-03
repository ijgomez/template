package org.myorganization.template.core.service;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.myorganization.template.core.repository.ParameterRepository;
import org.myorganization.template.domain.criteria.ParameterCriteria;
import org.myorganization.template.domain.dto.ParameterDTO;
import org.myorganization.template.domain.entity.Parameter;
import org.myorganization.template.domain.enums.ParameterType;
import org.myorganization.template.domain.exception.DuplicateEntityException;
import org.myorganization.template.domain.exception.EntityNotFoundException;
import org.myorganization.template.domain.exception.ValidationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ParameterServiceTest {

    @Mock
    private ParameterRepository parameterRepository;

    private ParameterService parameterService;

    @BeforeEach
    void setUp() {
        parameterService = new ParameterService(parameterRepository);
    }

    private Parameter createParameterEntity(String code, String description, String value, ParameterType type) {
        Parameter entity = new Parameter();
        entity.setId(1L);
        entity.setCode(code);
        entity.setDescription(description);
        entity.setValue(value);
        entity.setType(type);
        entity.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        entity.setLastModifiedAt(OffsetDateTime.now(ZoneOffset.UTC));
        return entity;
    }

    @Nested
    @DisplayName("create")
    class Create {

        @Test
        @DisplayName("valid parameter is created successfully")
        void create_validParameter_returnsCreatedDTO() {
            ParameterDTO dto = new ParameterDTO(null, "APP_NAME", "Application name", "MyApp", ParameterType.STRING, null, null);

            when(parameterRepository.existsByCode("APP_NAME")).thenReturn(false);
            Parameter savedEntity = createParameterEntity("APP_NAME", "Application name", "MyApp", ParameterType.STRING);
            when(parameterRepository.save(any(Parameter.class))).thenReturn(savedEntity);

            ParameterDTO result = parameterService.create(dto);

            assertThat(result.code()).isEqualTo("APP_NAME");
            assertThat(result.description()).isEqualTo("Application name");
            assertThat(result.value()).isEqualTo("MyApp");
            assertThat(result.type()).isEqualTo(ParameterType.STRING);
            assertThat(result.id()).isNotNull();

            ArgumentCaptor<Parameter> captor = ArgumentCaptor.forClass(Parameter.class);
            verify(parameterRepository).save(captor.capture());
            assertThat(captor.getValue().getCode()).isEqualTo("APP_NAME");
        }

        @Test
        @DisplayName("duplicate code throws DuplicateEntityException")
        void create_duplicateCode_throwsDuplicateEntityException() {
            ParameterDTO dto = new ParameterDTO(null, "APP_NAME", "Duplicate", "value", ParameterType.STRING, null, null);

            when(parameterRepository.existsByCode("APP_NAME")).thenReturn(true);

            assertThatThrownBy(() -> parameterService.create(dto))
                    .isInstanceOf(DuplicateEntityException.class);

            verify(parameterRepository, never()).save(any());
        }

        @Test
        @DisplayName("invalid INTEGER value throws ValidationException")
        void create_invalidIntegerValue_throwsValidationException() {
            ParameterDTO dto = new ParameterDTO(null, "MAX_RETRIES", "Max retries", "abc", ParameterType.INTEGER, null, null);

            when(parameterRepository.existsByCode("MAX_RETRIES")).thenReturn(false);

            assertThatThrownBy(() -> parameterService.create(dto))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("not a valid integer");

            verify(parameterRepository, never()).save(any());
        }

        @Test
        @DisplayName("valid INTEGER value is accepted")
        void create_validIntegerValue_succeeds() {
            ParameterDTO dto = new ParameterDTO(null, "MAX_RETRIES", "Max retries", "5", ParameterType.INTEGER, null, null);

            when(parameterRepository.existsByCode("MAX_RETRIES")).thenReturn(false);
            Parameter savedEntity = createParameterEntity("MAX_RETRIES", "Max retries", "5", ParameterType.INTEGER);
            when(parameterRepository.save(any(Parameter.class))).thenReturn(savedEntity);

            ParameterDTO result = parameterService.create(dto);

            assertThat(result.value()).isEqualTo("5");
            assertThat(result.type()).isEqualTo(ParameterType.INTEGER);
        }

        @Test
        @DisplayName("invalid BOOLEAN value throws ValidationException")
        void create_invalidBooleanValue_throwsValidationException() {
            ParameterDTO dto = new ParameterDTO(null, "ENABLED", "Feature flag", "yes", ParameterType.BOOLEAN, null, null);

            when(parameterRepository.existsByCode("ENABLED")).thenReturn(false);

            assertThatThrownBy(() -> parameterService.create(dto))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("BOOLEAN");

            verify(parameterRepository, never()).save(any());
        }

        @Test
        @DisplayName("valid BOOLEAN 'true' is accepted")
        void create_validBooleanTrue_succeeds() {
            ParameterDTO dto = new ParameterDTO(null, "ENABLED", "Feature flag", "true", ParameterType.BOOLEAN, null, null);

            when(parameterRepository.existsByCode("ENABLED")).thenReturn(false);
            Parameter savedEntity = createParameterEntity("ENABLED", "Feature flag", "true", ParameterType.BOOLEAN);
            when(parameterRepository.save(any(Parameter.class))).thenReturn(savedEntity);

            ParameterDTO result = parameterService.create(dto);

            assertThat(result.value()).isEqualTo("true");
        }

        @Test
        @DisplayName("valid BOOLEAN 'false' is accepted")
        void create_validBooleanFalse_succeeds() {
            ParameterDTO dto = new ParameterDTO(null, "ENABLED", "Feature flag", "false", ParameterType.BOOLEAN, null, null);

            when(parameterRepository.existsByCode("ENABLED")).thenReturn(false);
            Parameter savedEntity = createParameterEntity("ENABLED", "Feature flag", "false", ParameterType.BOOLEAN);
            when(parameterRepository.save(any(Parameter.class))).thenReturn(savedEntity);

            ParameterDTO result = parameterService.create(dto);

            assertThat(result.value()).isEqualTo("false");
        }

        @Test
        @DisplayName("invalid DATE value throws ValidationException")
        void create_invalidDateValue_throwsValidationException() {
            ParameterDTO dto = new ParameterDTO(null, "START_DATE", "Start date", "not-a-date", ParameterType.DATE, null, null);

            when(parameterRepository.existsByCode("START_DATE")).thenReturn(false);

            assertThatThrownBy(() -> parameterService.create(dto))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("ISO 8601");

            verify(parameterRepository, never()).save(any());
        }

        @Test
        @DisplayName("valid DATE with offset is accepted")
        void create_validDateWithOffset_succeeds() {
            ParameterDTO dto = new ParameterDTO(null, "START_DATE", "Start date", "2024-01-15T10:30:00Z", ParameterType.DATE, null, null);

            when(parameterRepository.existsByCode("START_DATE")).thenReturn(false);
            Parameter savedEntity = createParameterEntity("START_DATE", "Start date", "2024-01-15T10:30:00Z", ParameterType.DATE);
            when(parameterRepository.save(any(Parameter.class))).thenReturn(savedEntity);

            ParameterDTO result = parameterService.create(dto);

            assertThat(result.value()).isEqualTo("2024-01-15T10:30:00Z");
        }

        @Test
        @DisplayName("valid DATE (date only) is accepted")
        void create_validDateOnly_succeeds() {
            ParameterDTO dto = new ParameterDTO(null, "CUTOFF_DATE", "Cutoff date", "2024-01-15", ParameterType.DATE, null, null);

            when(parameterRepository.existsByCode("CUTOFF_DATE")).thenReturn(false);
            Parameter savedEntity = createParameterEntity("CUTOFF_DATE", "Cutoff date", "2024-01-15", ParameterType.DATE);
            when(parameterRepository.save(any(Parameter.class))).thenReturn(savedEntity);

            ParameterDTO result = parameterService.create(dto);

            assertThat(result.value()).isEqualTo("2024-01-15");
        }

        @Test
        @DisplayName("null value skips type validation")
        void create_nullValue_skipsValidation() {
            ParameterDTO dto = new ParameterDTO(null, "PARAM", "A param", null, ParameterType.INTEGER, null, null);

            when(parameterRepository.existsByCode("PARAM")).thenReturn(false);
            Parameter savedEntity = createParameterEntity("PARAM", "A param", null, ParameterType.INTEGER);
            savedEntity.setValue(null);
            when(parameterRepository.save(any(Parameter.class))).thenReturn(savedEntity);

            ParameterDTO result = parameterService.create(dto);

            assertThat(result.value()).isNull();
        }
    }

    @Nested
    @DisplayName("findByCode")
    class FindByCode {

        @Test
        @DisplayName("existing code returns ParameterDTO")
        void findByCode_existingCode_returnsDTO() {
            Parameter entity = createParameterEntity("APP_NAME", "Application name", "MyApp", ParameterType.STRING);
            when(parameterRepository.findByCode("APP_NAME")).thenReturn(Optional.of(entity));

            ParameterDTO result = parameterService.findByCode("APP_NAME");

            assertThat(result.code()).isEqualTo("APP_NAME");
            assertThat(result.description()).isEqualTo("Application name");
            assertThat(result.value()).isEqualTo("MyApp");
            assertThat(result.type()).isEqualTo(ParameterType.STRING);
        }

        @Test
        @DisplayName("non-existing code throws EntityNotFoundException")
        void findByCode_nonExistingCode_throwsEntityNotFoundException() {
            when(parameterRepository.findByCode("UNKNOWN")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> parameterService.findByCode("UNKNOWN"))
                    .isInstanceOf(EntityNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("findByCriteria")
    class FindByCriteria {

        @Test
        @DisplayName("returns paginated results")
        void findByCriteria_returnsPaginatedResults() {
            ParameterCriteria criteria = new ParameterCriteria(null, null, null);
            Pageable pageable = PageRequest.of(0, 10);

            Parameter entity = createParameterEntity("APP_NAME", "Application name", "MyApp", ParameterType.STRING);
            Page<Parameter> page = new PageImpl<>(List.of(entity), pageable, 1);

            when(parameterRepository.findAll(ArgumentMatchers.<Specification<Parameter>>any(), any(Pageable.class))).thenReturn(page);

            Page<ParameterDTO> result = parameterService.findByCriteria(criteria, pageable);

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).code()).isEqualTo("APP_NAME");
            assertThat(result.getTotalElements()).isEqualTo(1);
        }
    }

    @Nested
    @DisplayName("countByCriteria")
    class CountByCriteria {

        @Test
        @DisplayName("returns total count")
        void countByCriteria_returnsTotalCount() {
            ParameterCriteria criteria = new ParameterCriteria("APP", null, null);

            when(parameterRepository.count(ArgumentMatchers.<Specification<Parameter>>any())).thenReturn(5L);

            long count = parameterService.countByCriteria(criteria);

            assertThat(count).isEqualTo(5L);
        }
    }

    @Nested
    @DisplayName("update")
    class Update {

        @Test
        @DisplayName("existing parameter is updated successfully")
        void update_existingParameter_returnsUpdatedDTO() {
            Parameter entity = createParameterEntity("APP_NAME", "Old desc", "OldValue", ParameterType.STRING);
            when(parameterRepository.findByCode("APP_NAME")).thenReturn(Optional.of(entity));
            when(parameterRepository.save(any(Parameter.class))).thenReturn(entity);

            ParameterDTO dto = new ParameterDTO(1L, "APP_NAME", "New desc", "NewValue", ParameterType.STRING, null, null);
            ParameterDTO result = parameterService.update("APP_NAME", dto);

            assertThat(result.description()).isEqualTo("New desc");
            assertThat(result.value()).isEqualTo("NewValue");
            verify(parameterRepository).save(entity);
        }

        @Test
        @DisplayName("non-existing code throws EntityNotFoundException")
        void update_nonExistingCode_throwsEntityNotFoundException() {
            when(parameterRepository.findByCode("UNKNOWN")).thenReturn(Optional.empty());

            ParameterDTO dto = new ParameterDTO(null, "UNKNOWN", "Desc", "val", ParameterType.STRING, null, null);

            assertThatThrownBy(() -> parameterService.update("UNKNOWN", dto))
                    .isInstanceOf(EntityNotFoundException.class);

            verify(parameterRepository, never()).save(any());
        }

        @Test
        @DisplayName("invalid type-value on update throws ValidationException")
        void update_invalidTypeValue_throwsValidationException() {
            Parameter entity = createParameterEntity("MAX_RETRIES", "Max retries", "5", ParameterType.INTEGER);
            when(parameterRepository.findByCode("MAX_RETRIES")).thenReturn(Optional.of(entity));

            ParameterDTO dto = new ParameterDTO(1L, "MAX_RETRIES", "Max retries", "notanumber", ParameterType.INTEGER, null, null);

            assertThatThrownBy(() -> parameterService.update("MAX_RETRIES", dto))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("not a valid integer");

            verify(parameterRepository, never()).save(any());
        }

        @Test
        @DisplayName("type change with valid value succeeds")
        void update_typeChangeWithValidValue_succeeds() {
            Parameter entity = createParameterEntity("FEATURE", "Feature flag", "5", ParameterType.INTEGER);
            when(parameterRepository.findByCode("FEATURE")).thenReturn(Optional.of(entity));
            when(parameterRepository.save(any(Parameter.class))).thenReturn(entity);

            ParameterDTO dto = new ParameterDTO(1L, "FEATURE", "Feature flag", "true", ParameterType.BOOLEAN, null, null);
            parameterService.update("FEATURE", dto);

            assertThat(entity.getType()).isEqualTo(ParameterType.BOOLEAN);
            assertThat(entity.getValue()).isEqualTo("true");
        }
    }

    @Nested
    @DisplayName("delete")
    class Delete {

        @Test
        @DisplayName("existing parameter is deleted")
        void delete_existingParameter_deletesEntity() {
            Parameter entity = createParameterEntity("APP_NAME", "Application name", "MyApp", ParameterType.STRING);
            when(parameterRepository.findByCode("APP_NAME")).thenReturn(Optional.of(entity));

            parameterService.delete("APP_NAME");

            verify(parameterRepository).delete(entity);
        }

        @Test
        @DisplayName("non-existing code throws EntityNotFoundException")
        void delete_nonExistingCode_throwsEntityNotFoundException() {
            when(parameterRepository.findByCode("UNKNOWN")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> parameterService.delete("UNKNOWN"))
                    .isInstanceOf(EntityNotFoundException.class);

            verify(parameterRepository, never()).delete(any(Parameter.class));
        }
    }

    @Nested
    @DisplayName("validateTypeValueCompatibility")
    class ValidateTypeValue {

        @Test
        @DisplayName("INTEGER: valid positive number")
        void integerValidPositive() {
            parameterService.validateTypeValueCompatibility(ParameterType.INTEGER, "42");
            // No exception thrown
        }

        @Test
        @DisplayName("INTEGER: valid negative number")
        void integerValidNegative() {
            parameterService.validateTypeValueCompatibility(ParameterType.INTEGER, "-7");
            // No exception thrown
        }

        @Test
        @DisplayName("INTEGER: decimal value throws exception")
        void integerDecimalThrows() {
            assertThatThrownBy(() ->
                    parameterService.validateTypeValueCompatibility(ParameterType.INTEGER, "3.14"))
                    .isInstanceOf(ValidationException.class);
        }

        @Test
        @DisplayName("BOOLEAN: 'True' (uppercase T) throws exception")
        void booleanUppercaseTrueThrows() {
            assertThatThrownBy(() ->
                    parameterService.validateTypeValueCompatibility(ParameterType.BOOLEAN, "True"))
                    .isInstanceOf(ValidationException.class);
        }

        @Test
        @DisplayName("DATE: valid local datetime")
        void dateValidLocalDatetime() {
            parameterService.validateTypeValueCompatibility(ParameterType.DATE, "2024-06-15T14:30:00");
            // No exception thrown
        }

        @Test
        @DisplayName("DATE: valid date with timezone offset")
        void dateValidWithOffset() {
            parameterService.validateTypeValueCompatibility(ParameterType.DATE, "2024-06-15T14:30:00+02:00");
            // No exception thrown
        }

        @Test
        @DisplayName("STRING: empty string is valid")
        void stringEmptyIsValid() {
            parameterService.validateTypeValueCompatibility(ParameterType.STRING, "");
            // No exception thrown
        }

        @Test
        @DisplayName("STRING: any arbitrary text is valid")
        void stringArbitraryTextIsValid() {
            parameterService.validateTypeValueCompatibility(ParameterType.STRING, "anything goes 123 !@#$%");
            // No exception thrown
        }

        @Test
        @DisplayName("null type skips validation")
        void nullTypeSkipsValidation() {
            parameterService.validateTypeValueCompatibility(null, "any-value");
            // No exception thrown
        }

        @Test
        @DisplayName("null value skips validation")
        void nullValueSkipsValidation() {
            parameterService.validateTypeValueCompatibility(ParameterType.INTEGER, null);
            // No exception thrown
        }
    }
}
