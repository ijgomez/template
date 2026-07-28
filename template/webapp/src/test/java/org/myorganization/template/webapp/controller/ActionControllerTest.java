package org.myorganization.template.webapp.controller;

import java.time.OffsetDateTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.myorganization.template.core.service.ActionService;
import org.myorganization.template.domain.criteria.ActionCriteria;
import org.myorganization.template.domain.dto.ActionDTO;
import org.myorganization.template.domain.enums.ActionType;
import org.myorganization.template.domain.exception.EntityNotFoundException;
import org.myorganization.template.domain.exception.MethodNotAllowedException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link ActionControllerImpl}.
 */
class ActionControllerTest {

    private ActionService actionService;
    private ActionControllerImpl actionController;

    @BeforeEach
    void setUp() {
        actionService = mock(ActionService.class);
        actionController = new ActionControllerImpl(actionService);
    }

    @Test
    void findAll_shouldReturnPageOfActions() {
        Pageable pageable = PageRequest.of(0, 10);
        ActionDTO dto = sampleAction(1L);
        Page<ActionDTO> page = new PageImpl<>(List.of(dto), pageable, 1);
        when(actionService.findByCriteria(any(ActionCriteria.class), eq(pageable))).thenReturn(page);

        ResponseEntity<Page<ActionDTO>> response = actionController.findAll(0, 10, null, null, null);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getContent()).hasSize(1);
        assertThat(response.getBody().getContent().getFirst().code()).isEqualTo("USER_READ");
    }

    @Test
    void findAll_withFilters_shouldPassCriteriaToService() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<ActionDTO> page = new PageImpl<>(List.of(), pageable, 0);
        when(actionService.findByCriteria(any(ActionCriteria.class), eq(pageable))).thenReturn(page);

        ResponseEntity<Page<ActionDTO>> response = actionController.findAll(0, 10, "USER", "Read", ActionType.READ);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(actionService).findByCriteria(any(ActionCriteria.class), eq(pageable));
    }

    @Test
    void count_shouldReturnTotalCount() {
        when(actionService.countByCriteria(any(ActionCriteria.class))).thenReturn(14L);

        ResponseEntity<Long> response = actionController.count(null, null, null);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isEqualTo(14L);
    }

    @Test
    void count_withFilters_shouldPassCriteriaToService() {
        when(actionService.countByCriteria(any(ActionCriteria.class))).thenReturn(3L);

        ResponseEntity<Long> response = actionController.count("USER", null, ActionType.READ);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isEqualTo(3L);
    }

    @Test
    void findById_shouldReturnAction() {
        ActionDTO dto = sampleAction(1L);
        when(actionService.findById(1L)).thenReturn(dto);

        ResponseEntity<ActionDTO> response = actionController.findById(1L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().id()).isEqualTo(1L);
        assertThat(response.getBody().code()).isEqualTo("USER_READ");
    }

    @Test
    void findById_notFound_shouldThrowEntityNotFoundException() {
        when(actionService.findById(99L)).thenThrow(new EntityNotFoundException("Action", 99L));

        assertThatThrownBy(() -> actionController.findById(99L))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void update_shouldReturnUpdatedAction() {
        ActionDTO input = new ActionDTO(1L, "USER_READ", ActionType.READ, "Updated Name", "Updated desc", null, null);
        ActionDTO updated = new ActionDTO(1L, "USER_READ", ActionType.READ, "Updated Name", "Updated desc",
                OffsetDateTime.now(), OffsetDateTime.now());
        when(actionService.update(1L, input)).thenReturn(updated);

        ResponseEntity<ActionDTO> response = actionController.update(1L, input);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().name()).isEqualTo("Updated Name");
        verify(actionService).update(1L, input);
    }

    @Test
    void update_notFound_shouldThrowEntityNotFoundException() {
        ActionDTO input = new ActionDTO(99L, "GHOST", ActionType.READ, "Ghost", null, null, null);
        when(actionService.update(99L, input)).thenThrow(new EntityNotFoundException("Action", 99L));

        assertThatThrownBy(() -> actionController.update(99L, input))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void create_shouldThrowMethodNotAllowedException() {
        ActionDTO input = new ActionDTO(null, "NEW_ACTION", ActionType.WRITE, "New", "Desc", null, null);
        when(actionService.create(input)).thenThrow(
                new MethodNotAllowedException("Action creation is not allowed. Actions are managed via seed data."));

        assertThatThrownBy(() -> actionController.create(input))
                .isInstanceOf(MethodNotAllowedException.class)
                .hasMessageContaining("not allowed");
    }

    @Test
    void delete_shouldThrowMethodNotAllowedException() {
        doThrow(new MethodNotAllowedException("Action deletion is not allowed. Actions are managed via seed data."))
                .when(actionService).delete(1L);

        assertThatThrownBy(() -> actionController.delete(1L))
                .isInstanceOf(MethodNotAllowedException.class)
                .hasMessageContaining("not allowed");
    }

    private ActionDTO sampleAction(Long id) {
        return new ActionDTO(id, "USER_READ", ActionType.READ, "Query users",
                "Permission to query users", OffsetDateTime.now(), OffsetDateTime.now());
    }

}
