package org.myorganization.template.core.service;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.myorganization.template.core.repository.ActionRepository;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.myorganization.template.domain.criteria.ActionCriteria;
import org.myorganization.template.domain.dto.ActionDTO;
import org.myorganization.template.domain.entity.Action;
import org.myorganization.template.domain.enums.ActionType;
import org.myorganization.template.domain.exception.EntityNotFoundException;
import org.myorganization.template.domain.exception.MethodNotAllowedException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.RETURNS_DEEP_STUBS;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ActionServiceTest {

    @Mock
    private ActionRepository actionRepository;

    private ActionService actionService;

    @BeforeEach
    void setUp() {
        actionService = new ActionService(actionRepository);
    }

    @Test
    @DisplayName("findById: existing action returns ActionDTO")
    void findById_existingAction_returnsDTO() {
        Action action = createAction(1L, "USER_READ", ActionType.READ, "Consultar usuarios", "Descripción");

        when(actionRepository.findById(1L)).thenReturn(Optional.of(action));

        ActionDTO result = actionService.findById(1L);

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.code()).isEqualTo("USER_READ");
        assertThat(result.type()).isEqualTo(ActionType.READ);
        assertThat(result.name()).isEqualTo("Consultar usuarios");
        assertThat(result.description()).isEqualTo("Descripción");
    }

    @Test
    @DisplayName("findById: non-existing action throws EntityNotFoundException")
    void findById_nonExistingAction_throwsEntityNotFoundException() {
        when(actionRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> actionService.findById(999L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Action")
                .hasMessageContaining("999");
    }

    @Test
    @DisplayName("findByCriteria: returns paginated results")
    @SuppressWarnings("unchecked")
    void findByCriteria_returnsPaginatedResults() {
        Action action = createAction(1L, "USER_READ", ActionType.READ, "Consultar usuarios", null);
        Page<Action> page = new PageImpl<>(List.of(action), PageRequest.of(0, 10), 1);
        ActionCriteria criteria = new ActionCriteria(null, null, null);
        Pageable pageable = PageRequest.of(0, 10);

        when(actionRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(page);

        Page<ActionDTO> result = actionService.findByCriteria(criteria, pageable);

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).code()).isEqualTo("USER_READ");
    }

    @Test
    @DisplayName("countByCriteria: returns total count matching criteria")
    @SuppressWarnings("unchecked")
    void countByCriteria_returnsCount() {
        ActionCriteria criteria = new ActionCriteria("USER", null, null);

        when(actionRepository.count(any(Specification.class))).thenReturn(5L);

        long count = actionService.countByCriteria(criteria);

        assertThat(count).isEqualTo(5L);
    }

    @Test
    @DisplayName("update: existing action updates name, description, and type")
    void update_existingAction_updatesFields() {
        Action action = createAction(1L, "USER_READ", ActionType.READ, "Old name", "Old desc");

        when(actionRepository.findById(1L)).thenReturn(Optional.of(action));
        when(actionRepository.save(any(Action.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ActionDTO updateDTO = new ActionDTO(1L, "USER_READ", ActionType.WRITE, "New name", "New desc", null, null);

        ActionDTO result = actionService.update(1L, updateDTO);

        assertThat(result.name()).isEqualTo("New name");
        assertThat(result.description()).isEqualTo("New desc");
        assertThat(result.type()).isEqualTo(ActionType.WRITE);

        ArgumentCaptor<Action> captor = ArgumentCaptor.forClass(Action.class);
        verify(actionRepository).save(captor.capture());
        Action saved = captor.getValue();
        assertThat(saved.getName()).isEqualTo("New name");
        assertThat(saved.getDescription()).isEqualTo("New desc");
        assertThat(saved.getType()).isEqualTo(ActionType.WRITE);
    }

    @Test
    @DisplayName("update: non-existing action throws EntityNotFoundException")
    void update_nonExistingAction_throwsEntityNotFoundException() {
        when(actionRepository.findById(999L)).thenReturn(Optional.empty());

        ActionDTO dto = new ActionDTO(999L, "CODE", ActionType.READ, "Name", "Desc", null, null);

        assertThatThrownBy(() -> actionService.update(999L, dto))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Action")
                .hasMessageContaining("999");

        verify(actionRepository, never()).save(any());
    }

    @Test
    @DisplayName("create: always throws MethodNotAllowedException")
    void create_throwsMethodNotAllowedException() {
        ActionDTO dto = new ActionDTO(null, "NEW_ACTION", ActionType.READ, "New", "Desc", null, null);

        assertThatThrownBy(() -> actionService.create(dto))
                .isInstanceOf(MethodNotAllowedException.class)
                .hasMessageContaining("creation is not allowed");

        verify(actionRepository, never()).save(any());
    }

    @Test
    @DisplayName("delete: always throws MethodNotAllowedException")
    void delete_throwsMethodNotAllowedException() {
        assertThatThrownBy(() -> actionService.delete(1L))
                .isInstanceOf(MethodNotAllowedException.class)
                .hasMessageContaining("deletion is not allowed");

        verify(actionRepository, never()).delete(any(Action.class));
        verify(actionRepository, never()).deleteById(any());
    }

    @Test
    @DisplayName("findByCriteria: all filters build a full specification (code, name, type)")
    @SuppressWarnings("unchecked")
    void findByCriteria_allFilters_buildsSpecification() {
        ActionCriteria criteria = new ActionCriteria("USER", "Consultar", ActionType.READ);
        Pageable pageable = PageRequest.of(0, 10);
        Page<Action> page = new PageImpl<>(List.of(), pageable, 0);

        ArgumentCaptor<Specification<Action>> specCaptor = ArgumentCaptor.forClass(Specification.class);
        when(actionRepository.findAll(specCaptor.capture(), eq(pageable))).thenReturn(page);

        actionService.findByCriteria(criteria, pageable);

        Predicate predicate = evaluateSpecification(specCaptor.getValue());
        assertThat(predicate).isNotNull();
    }

    @Test
    @DisplayName("findByCriteria: blank criteria build an empty specification")
    @SuppressWarnings("unchecked")
    void findByCriteria_blankCriteria_buildsEmptySpecification() {
        ActionCriteria criteria = new ActionCriteria("  ", "", null);
        Pageable pageable = PageRequest.of(0, 10);
        Page<Action> page = new PageImpl<>(List.of(), pageable, 0);

        ArgumentCaptor<Specification<Action>> specCaptor = ArgumentCaptor.forClass(Specification.class);
        when(actionRepository.findAll(specCaptor.capture(), eq(pageable))).thenReturn(page);

        actionService.findByCriteria(criteria, pageable);

        Predicate predicate = evaluateSpecification(specCaptor.getValue());
        assertThat(predicate).isNotNull();
    }

    /**
     * Runs the given {@link Specification} against a mocked JPA Criteria API so the lambdas inside
     * {@code buildSpecification} execute and their branches are covered.
     */
    @SuppressWarnings("unchecked")
    private Predicate evaluateSpecification(Specification<Action> spec) {
        Root<Action> root = mock(Root.class, RETURNS_DEEP_STUBS);
        CriteriaQuery<?> query = mock(CriteriaQuery.class);
        CriteriaBuilder cb = mock(CriteriaBuilder.class);
        Predicate predicate = mock(Predicate.class);
        Path<Object> path = mock(Path.class);

        lenient().when(root.get(anyString())).thenReturn((Path) path);
        lenient().when(cb.conjunction()).thenReturn(predicate);
        lenient().when(cb.lower(any())).thenReturn(mock(Expression.class));
        lenient().when(cb.like(any(), anyString())).thenReturn(predicate);
        lenient().when(cb.equal(any(), any())).thenReturn(predicate);
        lenient().when(cb.and(any(Predicate.class), any(Predicate.class))).thenReturn(predicate);

        return spec.toPredicate(root, query, cb);
    }

    private Action createAction(Long id, String code, ActionType type, String name, String description) {
        Action action = new Action();
        action.setId(id);
        action.setCode(code);
        action.setType(type);
        action.setName(name);
        action.setDescription(description);
        action.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        action.setLastModifiedAt(OffsetDateTime.now(ZoneOffset.UTC));
        return action;
    }
}
