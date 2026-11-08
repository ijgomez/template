import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { Observable, of, throwError } from 'rxjs';

import { ActionListComponent } from './action-list.component';
import { ActionService } from '../../../../core/services/action.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CsvExportService } from '../../../../core/services/csv-export.service';
import { Action } from '../../models/action.model';

function action(id: number, overrides: Partial<Action> = {}): Action {
  return {
    id,
    code: `ACTION_${id}`,
    name: `Action ${id}`,
    type: 'READ',
    description: `Desc ${id}`,
    createdAt: '',
    lastModifiedAt: '',
    ...overrides,
  };
}

/**
 * Behavior tests for ActionListComponent covering filters, sorting,
 * pagination, CSV export, saving, deep links and the rendered toolbar and
 * sub-views. Services are stubbed; the real template is rendered.
 */
describe('ActionListComponent (behavior)', () => {
  let fixture: ComponentFixture<ActionListComponent>;
  let component: ActionListComponent;
  let canEdit: boolean;

  const rows = [
    action(1, { type: 'READ' }),
    action(2, { type: 'WRITE', description: null as unknown as string }),
    action(3, { type: 'EXECUTE' }),
  ];

  const actionService = {
    findByCriteria: (..._a: unknown[]): Observable<unknown> =>
      of({ content: rows, page: { size: 10, number: 0, totalElements: 25, totalPages: 3 } }),
    findAllByCriteria: (..._a: unknown[]): Observable<unknown> => of(rows),
    findById: (..._a: unknown[]): Observable<unknown> => of(rows[0]),
    update: (..._a: unknown[]): Observable<unknown> => of(rows[0]),
  };
  const notificationService = {
    showProgress: (..._a: unknown[]) => 'p',
    updateToSuccess: (..._a: unknown[]) => undefined,
    updateToError: (..._a: unknown[]) => undefined,
    dismiss: (..._a: unknown[]) => undefined,
  };
  const csvExportService = { export: (..._a: unknown[]) => undefined };

  const el = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const byTestId = (id: string): HTMLElement | null => el().querySelector(`[data-testid="${id}"]`);

  const render = async (): Promise<void> => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const create = async (): Promise<void> => {
    fixture = TestBed.createComponent(ActionListComponent);
    component = fixture.componentInstance;
    await render();
  };

  beforeEach(async () => {
    canEdit = true;
    await TestBed.configureTestingModule({
      imports: [ActionListComponent],
      providers: [
        provideRouter([]),
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        { provide: ActionService, useValue: actionService },
        { provide: AuthService, useValue: { hasAction: () => canEdit } },
        { provide: NotificationService, useValue: notificationService },
        { provide: CsvExportService, useValue: csvExportService },
      ],
    }).compileComponents();

    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loading', () => {
    it('should store the page and the total', async () => {
      await create();

      expect(component.actions()).toHaveLength(3);
      expect(component.totalElements()).toBe(25);
      expect(component.totalPages()).toBe(3);
      expect(component.isLoading()).toBe(false);
    });

    it('should notify an error when the backend fails', async () => {
      vi.spyOn(actionService, 'findByCriteria').mockReturnValue(throwError(() => new Error('boom')));
      const updateToError = vi.spyOn(notificationService, 'updateToError');

      await create();

      expect(component.isLoading()).toBe(false);
      expect(updateToError).toHaveBeenCalledWith('p', 'notification.error');
    });
  });

  describe('rendered list', () => {
    it('should render the filters, toolbar and table with type badges and description fallback', async () => {
      await create();

      expect(byTestId('actions-filter-form')).toBeTruthy();
      expect(byTestId('filter-code')).toBeTruthy();
      expect(byTestId('filter-type')).toBeTruthy();
      expect(byTestId('btn-export')).toBeTruthy();
      expect(byTestId('actions-table')).toBeTruthy();
      const text = el().textContent ?? '';
      expect(text).toContain('ACTION_1');
      expect(text).toContain('EXECUTE');
      expect(text).toContain('-');
    });

    it('should show the edit button only with ACTION_WRITE', async () => {
      await create();
      expect(byTestId('btn-edit')).toBeTruthy();
    });

    it('should hide the edit button without ACTION_WRITE', async () => {
      canEdit = false;
      await create();

      expect(byTestId('btn-edit')).toBeNull();
    });

    it('should disable edit until a row is selected', async () => {
      await create();
      const edit = byTestId('btn-edit') as HTMLButtonElement;
      expect(edit.disabled).toBe(true);

      component.selectRow(rows[0]);
      await render();

      expect(edit.disabled).toBe(false);
    });
  });

  describe('filters', () => {
    beforeEach(async () => {
      await create();
    });

    it('should update the filter signals from the inputs', () => {
      const code = byTestId('filter-code') as HTMLInputElement;
      const type = byTestId('filter-type') as HTMLSelectElement;

      code.value = 'ACTION';
      code.dispatchEvent(new Event('input'));
      type.value = 'WRITE';
      type.dispatchEvent(new Event('change'));

      expect(component.filterCode()).toBe('ACTION');
      expect(component.filterType()).toBe('WRITE');
    });

    it('should send only the active filters as criteria', () => {
      const spy = vi.spyOn(actionService, 'findByCriteria');
      component.filterCode.set('ACTION');
      component.filterType.set('WRITE');

      component.applyFilters();

      expect(spy.mock.calls[0][0]).toEqual({ code: 'ACTION', type: 'WRITE' });
    });

    it('should send no criteria when the filters are empty', () => {
      const spy = vi.spyOn(actionService, 'findByCriteria');

      component.applyFilters();

      expect(spy.mock.calls[0][0]).toEqual({});
    });

    it('should apply the filters on submit and reset the page', () => {
      const spy = vi.spyOn(actionService, 'findByCriteria');
      component.currentPage.set(2);

      (byTestId('actions-filter-form') as HTMLFormElement).dispatchEvent(new Event('submit'));

      expect(component.currentPage()).toBe(0);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should clear the filters from the clear button and reload', () => {
      const spy = vi.spyOn(actionService, 'findByCriteria');
      component.filterCode.set('x');
      component.filterType.set('READ');

      byTestId('btn-filter-clear')!.click();

      expect(component.filterCode()).toBe('');
      expect(component.filterType()).toBe('');
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('pagination and sorting', () => {
    beforeEach(async () => {
      await create();
    });

    it('goToPage should load a valid page and ignore invalid ones', () => {
      const spy = vi.spyOn(actionService, 'findByCriteria');

      component.goToPage(2);
      expect(component.currentPage()).toBe(2);
      expect(spy).toHaveBeenCalledTimes(1);

      component.goToPage(3);
      component.goToPage(-1);
      expect(component.currentPage()).toBe(2);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('changePageSize should reset the page and the selection', () => {
      component.currentPage.set(2);
      component.selectRow(rows[0]);

      component.changePageSize(50);

      expect(component.pageSize()).toBe(50);
      expect(component.currentPage()).toBe(0);
      expect(component.selectedRow()).toBeNull();
    });

    it('onSort should build the sort param and clear it without direction', () => {
      component.onSort({ column: 'code', direction: 'asc' });
      expect(component.sortParam()).toBe('code,asc');

      component.onSort({ column: 'code', direction: '' });
      expect(component.sortParam()).toBe('');
    });
  });

  describe('selection and navigation', () => {
    beforeEach(async () => {
      await create();
    });

    it('selectRow should toggle the selection', () => {
      component.selectRow(rows[0]);
      expect(component.selectedRow()).toEqual(rows[0]);

      component.selectRow(rows[0]);
      expect(component.selectedRow()).toBeNull();
    });

    it('viewSelectedAction and editSelectedAction should do nothing without a selection', () => {
      component.viewSelectedAction();
      component.editSelectedAction();

      expect(component.viewMode()).toBe('list');
    });

    it('should open the edit form from the toolbar and sync the URL', async () => {
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate');
      component.selectRow(rows[0]);
      await render();

      byTestId('btn-edit')!.click();
      await render();

      expect(component.viewMode()).toBe('edit');
      expect(el().querySelector('app-action-form')).toBeTruthy();
      expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: { view: 'edit', id: 1 } }));
    });

    it('should open the detail view and go back to the list', async () => {
      component.selectRow(rows[1]);
      component.viewSelectedAction();
      await render();

      expect(component.viewMode()).toBe('detail');
      expect(el().querySelector('app-action-form')).toBeTruthy();

      component.backToList();
      await render();

      expect(component.viewMode()).toBe('list');
      expect(component.selectedRow()).toBeNull();
      expect(byTestId('actions-table')).toBeTruthy();
    });
  });

  describe('restoring the view from the URL', () => {
    it('should open the detail for a loaded action', async () => {
      vi.restoreAllMocks();
      await TestBed.inject(Router).navigate([], { queryParams: { view: 'detail', id: 2 } });

      await create();

      expect(component.viewMode()).toBe('detail');
      expect(component.selectedAction()?.id).toBe(2);
    });

    it('should fetch the action by id when it is not in the loaded page', async () => {
      vi.restoreAllMocks();
      const findById = vi.spyOn(actionService, 'findById').mockReturnValue(of(action(99)));
      await TestBed.inject(Router).navigate([], { queryParams: { view: 'edit', id: 99 } });

      await create();

      expect(findById).toHaveBeenCalledWith(99);
      expect(component.viewMode()).toBe('edit');
      expect(component.selectedAction()?.id).toBe(99);
    });

    it('should fall back to the list URL when the action cannot be fetched', async () => {
      vi.restoreAllMocks();
      vi.spyOn(actionService, 'findById').mockReturnValue(throwError(() => new Error('404')));
      await TestBed.inject(Router).navigate([], { queryParams: { view: 'detail', id: 99 } });
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

      await create();

      expect(component.viewMode()).toBe('list');
      expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: {} }));
    });
  });

  describe('saveAction', () => {
    beforeEach(async () => {
      await create();
    });

    it('should ignore a payload without id', () => {
      const update = vi.spyOn(actionService, 'update');

      component.saveAction({ name: 'x' });

      expect(update).not.toHaveBeenCalled();
    });

    it('should update, notify, go back to the list and reload', () => {
      const update = vi.spyOn(actionService, 'update');
      const success = vi.spyOn(notificationService, 'updateToSuccess');
      const reload = vi.spyOn(actionService, 'findByCriteria');
      component.showEditForm(rows[0]);

      component.saveAction({ id: 1, name: 'New name' });

      expect(update).toHaveBeenCalledWith(1, { id: 1, name: 'New name' });
      expect(success).toHaveBeenCalledWith('p', 'notification.update.success');
      expect(component.viewMode()).toBe('list');
      expect(component.isSaving()).toBe(false);
      expect(reload).toHaveBeenCalled();
    });

    it('should notify an error and stay in the form when the update fails', () => {
      vi.spyOn(actionService, 'update').mockReturnValue(throwError(() => new Error('boom')));
      const updateToError = vi.spyOn(notificationService, 'updateToError');
      component.showEditForm(rows[0]);

      component.saveAction({ id: 1 });

      expect(updateToError).toHaveBeenCalledWith('p', 'notification.update.error');
      expect(component.isSaving()).toBe(false);
      expect(component.viewMode()).toBe('edit');
    });
  });

  describe('exportCsv', () => {
    beforeEach(async () => {
      await create();
    });

    it('should export the rows from the toolbar button', () => {
      const spy = vi.spyOn(csvExportService, 'export');
      const success = vi.spyOn(notificationService, 'updateToSuccess');

      byTestId('btn-export')!.click();

      const [headers, data, name] = spy.mock.calls[0] as unknown as [string[], string[][], string];
      expect(name).toBe('actions');
      expect(headers).toHaveLength(4);
      expect(data[0]).toEqual(['ACTION_1', 'Action 1', 'READ', 'Desc 1']);
      expect(data[1][3]).toBe('');
      expect(success).toHaveBeenCalledWith('p', 'notification.export.success');
    });

    it('should notify an error when there is nothing to export', () => {
      vi.spyOn(actionService, 'findAllByCriteria').mockReturnValue(of([]));
      const spy = vi.spyOn(csvExportService, 'export');
      const updateToError = vi.spyOn(notificationService, 'updateToError');

      component.exportCsv();

      expect(spy).not.toHaveBeenCalled();
      expect(updateToError).toHaveBeenCalledWith('p', 'notification.export.empty');
    });

    it('should notify an error when the backend fails', () => {
      vi.spyOn(actionService, 'findAllByCriteria').mockReturnValue(throwError(() => new Error('boom')));
      const updateToError = vi.spyOn(notificationService, 'updateToError');

      component.exportCsv();

      expect(updateToError).toHaveBeenCalledWith('p', 'notification.export.error');
    });
  });
});
