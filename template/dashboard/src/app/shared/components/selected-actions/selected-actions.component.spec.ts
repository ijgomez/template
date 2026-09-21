import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { TpSelectedActionsComponent } from './selected-actions.component';
import { ProfileService } from '../../../core/services/profile.service';
import { Action } from '../../../features/administration/security/profiles/models/profile.model';
import { Page } from '../../../core/models/page.model';

/** Builds an Action with sensible defaults. */
function action(id: number, overrides: Partial<Action> = {}): Action {
  return {
    id,
    code: `CODE_${id}`,
    type: 'READ',
    name: `Action ${id}`,
    ...overrides,
  };
}

/** Wraps a list of actions in a Spring-style Page. */
function pageOf(actions: Action[]): Page<Action> {
  return {
    content: actions,
    page: { size: 1000, number: 0, totalElements: actions.length, totalPages: 1 },
  };
}

describe('TpSelectedActionsComponent', () => {
  let component: TpSelectedActionsComponent;
  let fixture: ComponentFixture<TpSelectedActionsComponent>;
  let profileService: { findAllActions: ReturnType<typeof vi.fn> };

  const allActions: Action[] = [
    action(1, { code: 'A1', name: 'Alpha', type: 'READ' }),
    action(2, { code: 'B2', name: 'Beta', type: 'WRITE' }),
    action(3, { code: 'C3', name: 'Gamma', type: 'EXECUTE' }),
    action(4, { code: 'D4', name: 'Delta', type: 'OTHER' }),
    action(5, { code: 'E5', name: 'Epsilon', type: 'READ' }),
    action(6, { code: 'F6', name: 'Zeta', type: 'READ' }),
    action(7, { code: 'G7', name: 'Eta', type: 'READ' }),
  ];

  beforeEach(async () => {
    profileService = {
      findAllActions: vi.fn().mockReturnValue(of(pageOf(allActions))),
    };

    await TestBed.configureTestingModule({
      imports: [TpSelectedActionsComponent],
      providers: [
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        { provide: ProfileService, useValue: profileService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TpSelectedActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // triggers ngOnInit -> loadAllActions
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load all actions on init', () => {
    expect(profileService.findAllActions).toHaveBeenCalled();
    expect(component.allActions().length).toBe(7);
    expect(component.loading()).toBe(false);
  });

  it('should set loading false when loadAllActions fails', () => {
    profileService.findAllActions.mockReturnValue(throwError(() => new Error('boom')));
    const localFixture = TestBed.createComponent(TpSelectedActionsComponent);
    localFixture.detectChanges();
    expect(localFixture.componentInstance.loading()).toBe(false);
    expect(localFixture.componentInstance.allActions().length).toBe(0);
  });

  // ─── ControlValueAccessor ───────────────────────────────────

  describe('ControlValueAccessor', () => {
    it('writeValue should set selectedIds and default to [] on null', () => {
      component.writeValue([1, 2]);
      expect(component.selectedIds()).toEqual([1, 2]);
      component.writeValue(null);
      expect(component.selectedIds()).toEqual([]);
    });

    it('setDisabledState should update the disabled signal', () => {
      component.setDisabledState(true);
      expect(component.disabled()).toBe(true);
    });

    it('registerOnChange should be invoked when selection changes', () => {
      const onChange = vi.fn();
      component.registerOnChange(onChange);
      component.writeValue([1]);
      component.removeAction(action(1));
      expect(onChange).toHaveBeenCalledWith([]);
    });

    it('registerOnTouched should be invoked when the modal opens', () => {
      const onTouched = vi.fn();
      component.registerOnTouched(onTouched);
      component.openModal();
      expect(onTouched).toHaveBeenCalled();
    });
  });

  // ─── Selected list computed ─────────────────────────────────

  describe('selected list', () => {
    beforeEach(() => component.writeValue([1, 2, 3]));

    it('selectedActions should resolve IDs to loaded actions', () => {
      expect(component.selectedActions().map(a => a.id)).toEqual([1, 2, 3]);
    });

    it('selectedActions should ignore unknown IDs', () => {
      component.writeValue([1, 999]);
      expect(component.selectedActions().map(a => a.id)).toEqual([1]);
    });

    it('totalCount should reflect the number of selected IDs', () => {
      expect(component.totalCount()).toBe(3);
    });

    it('filteredSelectedActions should return all when filter is empty', () => {
      expect(component.filteredSelectedActions().length).toBe(3);
    });

    it('filteredSelectedActions should match by code or name (case-insensitive)', () => {
      component.onFilterChange('beta');
      expect(component.filteredSelectedActions().map(a => a.id)).toEqual([2]);
      component.onFilterChange('a1');
      expect(component.filteredSelectedActions().map(a => a.id)).toEqual([1]);
    });

    it('removeAction should drop the action from the selection', () => {
      component.removeAction(action(2));
      expect(component.selectedIds()).toEqual([1, 3]);
    });
  });

  // ─── Modal ──────────────────────────────────────────────────

  describe('modal', () => {
    it('openModal should copy current selection and reset state', () => {
      component.writeValue([2]);
      component.openModal();
      expect(component.modalOpen()).toBe(true);
      expect(component.modalSelectedIds()).toEqual([2]);
      expect(component.modalSearch()).toBe('');
      expect(component.modalPage()).toBe(0);
    });

    it('openModal should do nothing when disabled', () => {
      component.setDisabledState(true);
      component.openModal();
      expect(component.modalOpen()).toBe(false);
    });

    it('closeModal should close without changing the selection', () => {
      component.writeValue([1]);
      component.openModal();
      component.toggleModalAction(2);
      component.closeModal();
      expect(component.modalOpen()).toBe(false);
      expect(component.selectedIds()).toEqual([1]);
    });

    it('confirmSelection should apply the modal selection to the form value', () => {
      const onChange = vi.fn();
      component.registerOnChange(onChange);
      component.openModal();
      component.toggleModalAction(1);
      component.toggleModalAction(3);
      component.confirmSelection();
      expect(component.selectedIds()).toEqual([1, 3]);
      expect(onChange).toHaveBeenCalledWith([1, 3]);
      expect(component.modalOpen()).toBe(false);
    });

    it('toggleModalAction should add and remove an action', () => {
      component.toggleModalAction(5);
      expect(component.isModalActionSelected(5)).toBe(true);
      component.toggleModalAction(5);
      expect(component.isModalActionSelected(5)).toBe(false);
    });

    it('modalSelectedCount should reflect the modal selection size', () => {
      component.toggleModalAction(1);
      component.toggleModalAction(2);
      expect(component.modalSelectedCount()).toBe(2);
    });

    it('onModalSearchChange should filter and reset the page', () => {
      component.modalGoToPage(1);
      component.onModalSearchChange('alpha');
      expect(component.modalSearch()).toBe('alpha');
      expect(component.modalPage()).toBe(0);
      expect(component.modalFilteredActions().map(a => a.id)).toEqual([1]);
    });

    it('onModalPageSizeChange should update size and reset page', () => {
      component.modalGoToPage(1);
      component.onModalPageSizeChange(10);
      expect(component.modalPageSize()).toBe(10);
      expect(component.modalPage()).toBe(0);
    });
  });

  // ─── Modal pagination computed ──────────────────────────────

  describe('modal pagination', () => {
    it('modalTotalElements / modalTotalPages should reflect the filtered set', () => {
      expect(component.modalTotalElements()).toBe(7);
      expect(component.modalTotalPages()).toBe(2); // 7 / 5 -> 2
    });

    it('modalPageActions should return the current page slice', () => {
      expect(component.modalPageActions().map(a => a.id)).toEqual([1, 2, 3, 4, 5]);
      component.modalGoToPage(1);
      expect(component.modalPageActions().map(a => a.id)).toEqual([6, 7]);
    });

    it('modalShowingFrom / modalShowingTo should reflect the page window', () => {
      expect(component.modalShowingFrom()).toBe(1);
      expect(component.modalShowingTo()).toBe(5);
      component.modalGoToPage(1);
      expect(component.modalShowingFrom()).toBe(6);
      expect(component.modalShowingTo()).toBe(7);
    });

    it('modalShowingFrom should be 0 when there are no elements', () => {
      component.onModalSearchChange('no-match-xyz');
      expect(component.modalTotalElements()).toBe(0);
      expect(component.modalShowingFrom()).toBe(0);
      expect(component.modalTotalPages()).toBe(1);
    });

    it('modalGoToPage should ignore out-of-range pages', () => {
      component.modalGoToPage(-1);
      expect(component.modalPage()).toBe(0);
      component.modalGoToPage(99);
      expect(component.modalPage()).toBe(0);
    });

    it('modalVisiblePages should list all pages when total <= 5', () => {
      expect(component.modalVisiblePages()).toEqual([0, 1]);
    });

    it('modalVisiblePages should cap at 5 pages for large sets', () => {
      const many = Array.from({ length: 100 }, (_, i) => action(i + 1));
      component.allActions.set(many);
      component.onModalPageSizeChange(5); // 20 pages
      component.modalGoToPage(10);
      expect(component.modalVisiblePages().length).toBe(5);
      expect(component.modalVisiblePages()).toContain(10);
    });
  });

  // ─── Select-all on page ─────────────────────────────────────

  describe('toggleAllModalActions', () => {
    it('should select every action on the current page', () => {
      component.toggleAllModalActions();
      expect(component.allPageActionsSelected).toBe(true);
      expect(component.modalSelectedIds()).toEqual([1, 2, 3, 4, 5]);
    });

    it('should deselect every action on the current page when all are selected', () => {
      component.toggleAllModalActions();
      component.toggleAllModalActions();
      expect(component.allPageActionsSelected).toBe(false);
      expect(component.modalSelectedIds()).toEqual([]);
    });

    it('allPageActionsSelected should be false on an empty page', () => {
      component.onModalSearchChange('no-match-xyz');
      expect(component.allPageActionsSelected).toBe(false);
    });
  });

  // ─── Helpers ────────────────────────────────────────────────

  describe('getTypeBadgeClasses', () => {
    it('should map known types to their badge classes', () => {
      expect(component.getTypeBadgeClasses('READ')).toContain('text-info');
      expect(component.getTypeBadgeClasses('write')).toContain('text-warning');
      expect(component.getTypeBadgeClasses('Execute')).toContain('text-success');
    });

    it('should fall back to secondary for unknown or empty types', () => {
      expect(component.getTypeBadgeClasses('SOMETHING')).toContain('text-secondary');
      expect(component.getTypeBadgeClasses('')).toContain('text-secondary');
    });
  });
});
