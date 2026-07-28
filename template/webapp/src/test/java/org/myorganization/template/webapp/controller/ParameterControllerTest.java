package org.myorganization.template.webapp.controller;

import java.time.OffsetDateTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.myorganization.template.core.service.ParameterService;
import org.myorganization.template.domain.criteria.ParameterCriteria;
import org.myorganization.template.domain.dto.ParameterDTO;
import org.myorganization.template.domain.enums.ParameterType;
import org.myorganization.template.domain.exception.DuplicateEntityException;
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
 * Unit tests for {@link ParameterController}.
 */
class ParameterControllerTest {

    private ParameterService parameterService;
    private ParameterController parameterController;

    @BeforeEach
    void setUp() {
        parameterService = mock(ParameterService.class);
        parameterController = new ParameterController(parameterService);
    }

    @Test
    void findAll_shouldReturnPageOfParameters() {
        Pageable pageable = PageRequest.of(0, 10);
        ParameterDTO dto = sampleParameter("APP_NAME");
        Page<ParameterDTO> page = new PageImpl<>(List.of(dto), pageable, 1);
        when(parameterService.findByCriteria(any(ParameterCriteria.class), eq(pageable))).thenReturn(page);

        ResponseEntity<Page<ParameterDTO>> response = parameterController.findAll(null, null, null, pageable);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getContent()).hasSize(1);
        assertThat(response.getBody().getContent().getFirst().code()).isEqualTo("APP_NAME");
    }

    @Test
    void findAll_withFilters_shouldPassCriteriaToService() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<ParameterDTO> page = new PageImpl<>(List.of(), pageable, 0);
        when(parameterService.findByCriteria(any(ParameterCriteria.class), eq(pageable))).thenReturn(page);

        ResponseEntity<Page<ParameterDTO>> response =
                parameterController.findAll("APP", "Application", ParameterType.STRING, pageable);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(parameterService).findByCriteria(any(ParameterCriteria.class), eq(pageable));
    }

    @Test
    void count_shouldReturnTotalCount() {
        when(parameterService.countByCriteria(any(ParameterCriteria.class))).thenReturn(5L);

        ResponseEntity<Long> response = parameterController.count(null, null, null);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isEqualTo(5L);
    }

    @Test
    void count_withFilters_shouldPassCriteriaToService() {
        when(parameterService.countByCriteria(any(ParameterCriteria.class))).thenReturn(2L);

        ResponseEntity<Long> response = parameterController.count("APP", null, ParameterType.STRING);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isEqualTo(2L);
    }

    @Test
    void create_shouldReturn201WithCreatedParameter() {
        ParameterDTO input = new ParameterDTO(null, "NEW_PARAM", "New parameter", "value1",
                ParameterType.STRING, null, null);
        ParameterDTO created = new ParameterDTO(1L, "NEW_PARAM", "New parameter", "value1",
                ParameterType.STRING, OffsetDateTime.now(), OffsetDateTime.now());
        when(parameterService.create(input)).thenReturn(created);

        ResponseEntity<ParameterDTO> response = parameterController.create(input);

        assertThat(response.getStatusCode().value()).isEqualTo(201);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().id()).isEqualTo(1L);
        assertThat(response.getBody().code()).isEqualTo("NEW_PARAM");
        verify(parameterService).create(input);
    }

    @Test
    void create_withDuplicateCode_shouldThrowDuplicateEntityException() {
        ParameterDTO input = new ParameterDTO(null, "APP_NAME", "Duplicate", "val",
                ParameterType.STRING, null, null);
        when(parameterService.create(input))
                .thenThrow(new DuplicateEntityException("Parameter", "code", "APP_NAME"));

        assertThatThrownBy(() -> parameterController.create(input))
                .isInstanceOf(DuplicateEntityException.class);
    }

    @Test
    void create_withInvalidTypeValue_shouldThrowValidationException() {
        ParameterDTO input = new ParameterDTO(null, "MAX_RETRIES", "Max retries", "not-a-number",
                ParameterType.INTEGER, null, null);
        when(parameterService.create(input))
                .thenThrow(new ValidationException("Value 'not-a-number' is not a valid integer for type INTEGER"));

        assertThatThrownBy(() -> parameterController.create(input))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("not a valid integer");
    }

    @Test
    void findByCode_shouldReturnParameter() {
        ParameterDTO dto = sampleParameter("APP_NAME");
        when(parameterService.findByCode("APP_NAME")).thenReturn(dto);

        ResponseEntity<ParameterDTO> response = parameterController.findByCode("APP_NAME");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().code()).isEqualTo("APP_NAME");
    }

    @Test
    void findByCode_notFound_shouldThrowEntityNotFoundException() {
        when(parameterService.findByCode("UNKNOWN"))
                .thenThrow(new EntityNotFoundException("Parameter", "UNKNOWN"));

        assertThatThrownBy(() -> parameterController.findByCode("UNKNOWN"))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void update_shouldReturnUpdatedParameter() {
        ParameterDTO input = new ParameterDTO(1L, "APP_NAME", "Updated desc", "NewApp",
                ParameterType.STRING, null, null);
        ParameterDTO updated = new ParameterDTO(1L, "APP_NAME", "Updated desc", "NewApp",
                ParameterType.STRING, OffsetDateTime.now(), OffsetDateTime.now());
        when(parameterService.update("APP_NAME", input)).thenReturn(updated);

        ResponseEntity<ParameterDTO> response = parameterController.update("APP_NAME", input);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().description()).isEqualTo("Updated desc");
        verify(parameterService).update("APP_NAME", input);
    }

    @Test
    void update_notFound_shouldThrowEntityNotFoundException() {
        ParameterDTO input = new ParameterDTO(null, "GHOST", "Ghost", "val",
                ParameterType.STRING, null, null);
        when(parameterService.update("GHOST", input))
                .thenThrow(new EntityNotFoundException("Parameter", "GHOST"));

        assertThatThrownBy(() -> parameterController.update("GHOST", input))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void update_withInvalidTypeValue_shouldThrowValidationException() {
        ParameterDTO input = new ParameterDTO(1L, "ENABLED", "Is enabled", "maybe",
                ParameterType.BOOLEAN, null, null);
        when(parameterService.update("ENABLED", input))
                .thenThrow(new ValidationException("Value 'maybe' is not valid for type BOOLEAN"));

        assertThatThrownBy(() -> parameterController.update("ENABLED", input))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("not valid for type BOOLEAN");
    }

    @Test
    void delete_shouldReturn204() {
        doNothing().when(parameterService).delete("APP_NAME");

        ResponseEntity<Void> response = parameterController.delete("APP_NAME");

        assertThat(response.getStatusCode().value()).isEqualTo(204);
        verify(parameterService).delete("APP_NAME");
    }

    @Test
    void delete_notFound_shouldThrowEntityNotFoundException() {
        doThrow(new EntityNotFoundException("Parameter", "UNKNOWN"))
                .when(parameterService).delete("UNKNOWN");

        assertThatThrownBy(() -> parameterController.delete("UNKNOWN"))
                .isInstanceOf(EntityNotFoundException.class);
    }

    private ParameterDTO sampleParameter(String code) {
        return new ParameterDTO(1L, code, "Application name", "TemplateApp",
                ParameterType.STRING, OffsetDateTime.now(), OffsetDateTime.now());
    }

}
