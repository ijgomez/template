import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { ParametersComponent } from './parameters.component';
import { ParameterService } from '../../../core/services/parameter.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Parameter } from '../../../core/models/parameter.model';
import { Page } from '../../../core/models/page.model';

function parameter(code: string, overrides: Partial<Parameter> = {}): Parameter {
  return {
    id: 1,
    code,
    description: `Desc ${code}`,
    value: 'v',
    type: 'STRING',
    createdAt: null,
    lastModifiedAt: null,
    ...overrides,
  };
}

function pageOf(items: Parameter[], totalElements = items.length): Page<Parameter> {
  return {
    content: items,
    page: { size: 10, number: 0, totalElements, totalPages: Math.ceil(totalElements / 10) || 0 },
  };
}

describe('ParametersComponent', () => {
  let component: ParametersComponent;
  let fixture: ComponentFixture<ParametersComponent>;
  let parameterService: {
    findByCriteria: ReturnType<typeof vi.fn>;
    findAllByCriteria: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let notification: {
    showError: ReturnType<typeof vi.fn>;
    showSuccess: ReturnType<typeof vi.fn>;
    showProgress: ReturnType<typeof vi.fn>;
    updateToSuccess: ReturnType<typeof vi.fn>;
    updateToError: ReturnType<typeof vi.fn>;
  };
  let authHasAction: ReturnType<typeof vi.fn>;

  const listPage = pageOf([parameter('A'), parameter('B'), parameter('C')], 25);

  beforeEach(async () => {
    parameterService = {
      findByCriteria: vi.fn().mockReturnValue(of(listPage)),
      findAllByCriteria: vi.fn().mockReturnValue(of(listPage.content)),
      create: vi.fn().mockReturnValue(of(parameter('A'))),
      update: vi.fn().mockReturnValue(of(parameter('A'))),
      delete: vi.fn().mockReturnValue(of(void 0)),
    };
    notification = {
      showError: vi.fn().mockReturnValue('err-id'),
      showSuccess: vi.fn().mockReturnValue('ok-id'),
      showProgress: vi.fn().mockReturnValue('progress-id'),
      updateToSuccess: vi.fn(),
      updateToError: vi.fn(),
    };
    authHasAction = vi.fn().mockReturnValue(true);

    await TestBed.configureTestingModule({
      imports: [ParametersComponent],
      providers: [
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        { provide: ParameterService, useValue: parameterService },
        { provide: AuthService, useValue: { hasAction: authHasAction } },
        { provide: NotificationService, useValue: notification },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ParametersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // constructor already called loadParameters
  });

  it('should create and load parameters on construction', () => {
    expect(component).toBeTruthy();
    expect(parameterService.findByCriteria).toHaveBeenCalled();
    expect(component.parameters().length).toBe(3);
    expect(component.totalElements()).toBe(25);
    expect(component.isLoading()).toBe(false);
  });

  it('should stop loading when the list request fails', () => {
    parameterService.findByCriteria.mockReturnValue(throwError(() => new Error('boom')));
    component.loadParameters();
    expect(component.isLoading()).toBe(false);
  });

  it('canWrite should reflect the SYSTEM_PARAMETER_WRITE action', () => {
    expect(component.canWrite()).toBe(true);
    expect(authHasAction).toHaveBeenCalledWith('SYSTEM_PARAMETER_WRITE');
  });

  describe('showing range', () => {
    it('showingFrom / showingTo should reflect the page window', () => {
      component.currentPage.set(1);
      component.pageSize.set(10);
      component.totalElements.set(25);
      expect(component.showingFrom()).toBe(11);
      expect(component.showingTo()).toBe(20);
    });

    it('showingTo should cap at totalElements on the last page', () => {
      component.currentPage.set(2);
      component.pageSize.set(10);
      component.totalElements.set(25);
      expect(component.showingTo()).toBe(25);
    });
  });

  // ─── Filters ────────────────────────────────────────────────

  describe('filters', () => {
    it('applyFilters should reset the page and send all active criteria', () => {
      component.currentPage.set(3);
      component.filterCode.set('COD');
      component.filterDescription.set('desc');
      component.filterType.set('INTEGER');
      parameterService.findByCriteria.mockClear();
      component.applyFilters();
      expect(component.currentPage()).toBe(0);
      expect(parameterService.findByCriteria).toHaveBeenCalledWith(
        { code: 'COD', description: 'desc', type: 'INTEGER' }, 0, 10, ''
      );
    });

    it('clearFilters should reset all filters and reload', () => {
      component.filterCode.set('COD');
      component.filterDescription.set('desc');
      component.filterType.set('BOOLEAN');
      parameterService.findByCriteria.mockClear();
      component.clearFilters();
      expect(component.filterCode()).toBe('');
      expect(component.filterDescription()).toBe('');
      expect(component.filterType()).toBe('');
      expect(parameterService.findByCriteria).toHaveBeenCalledWith({}, 0, 10, '');
    });
  });

  // ─── Sorting & pagination ───────────────────────────────────

  describe('sorting and pagination', () => {
    it('onSort should set the sort param and reload', () => {
      parameterService.findByCriteria.mockClear();
      component.onSort({ column: 'code', direction: 'desc' });
      expect(component.sortParam()).toBe('code,desc');
      expect(component.currentPage()).toBe(0);
      expect(parameterService.findByCriteria).toHaveBeenCalledWith({}, 0, 10, 'code,desc');
    });

    it('onSort should clear the sort param when direction is null', () => {
      component.sortParam.set('code,asc');
      component.onSort({ column: 'code', direction: '' });
      expect(component.sortParam()).toBe('');
    });

    it('goToPage should navigate within range and ignore out-of-range', () => {
      component.totalPages.set(3);
      parameterService.findByCriteria.mockClear();
      component.goToPage(2);
      expect(component.currentPage()).toBe(2);
      component.goToPage(-1);
      component.goToPage(99);
      expect(component.currentPage()).toBe(2);
      expect(parameterService.findByCriteria).toHaveBeenCalledTimes(1);
    });

    it('changePageSize should update the size, reset page and reload', () => {
      parameterService.findByCriteria.mockClear();
      component.changePageSize(50);
      expect(component.pageSize()).toBe(50);
      expect(component.currentPage()).toBe(0);
      expect(parameterService.findByCriteria).toHaveBeenCalledWith({}, 0, 50, '');
    });
  });

  // ─── Row selection ──────────────────────────────────────────

  describe('row selection', () => {
    it('selectRow should select and toggle-off the same row by code', () => {
      const p = parameter('A');
      component.selectRow(p);
      expect(component.selectedRow()?.code).toBe('A');
      component.selectRow(p);
      expect(component.selectedRow()).toBeNull();
    });

    it('editSelectedParameter should open the edit view when a row is selected', () => {
      component.selectRow(parameter('A'));
      component.editSelectedParameter();
      expect(component.viewMode()).toBe('edit');
    });

    it('deleteSelectedParameter should open the confirm dialog when a row is selected', () => {
      component.selectRow(parameter('A'));
      component.deleteSelectedParameter();
      expect(component.showDeleteConfirm()).toBe(true);
      expect(component.deleteTarget()?.code).toBe('A');
    });

    it('editSelectedParameter should do nothing without a selection', () => {
      component.selectedRow.set(null);
      component.editSelectedParameter();
      expect(component.viewMode()).toBe('list');
    });
  });

  // ─── Navigation ─────────────────────────────────────────────

  describe('navigation', () => {
    it('viewDetail should copy data and switch to detail', () => {
      component.viewDetail(parameter('A'));
      expect(component.viewMode()).toBe('detail');
      expect(component.formData().code).toBe('A');
    });

    it('openCreate should reset to an empty parameter', () => {
      component.openCreate();
      expect(component.viewMode()).toBe('create');
      expect(component.formData().code).toBe('');
      expect(component.formData().type).toBe('STRING');
    });

    it('openEdit should copy the parameter and switch to edit', () => {
      component.openEdit(parameter('A'));
      expect(component.viewMode()).toBe('edit');
      expect(component.formData().code).toBe('A');
    });

    it('backToList should reset view and clear delete state', () => {
      component.confirmDelete(parameter('A'));
      component.backToList();
      expect(component.viewMode()).toBe('list');
      expect(component.showDeleteConfirm()).toBe(false);
      expect(component.deleteTarget()).toBeNull();
    });
  });

  // ─── Save ───────────────────────────────────────────────────

  describe('saveParameter', () => {
    it('should create when in create mode and reload on success', () => {
      component.openCreate();
      parameterService.findByCriteria.mockClear();
      component.saveParameter(parameter('NEW'));
      expect(parameterService.create).toHaveBeenCalled();
      expect(notification.updateToSuccess).toHaveBeenCalledWith('progress-id', 'notification.create.success');
      expect(component.viewMode()).toBe('list');
      expect(parameterService.findByCriteria).toHaveBeenCalled();
    });

    it('should report an error when create fails', () => {
      parameterService.create.mockReturnValue(throwError(() => new Error('boom')));
      component.openCreate();
      component.saveParameter(parameter('NEW'));
      expect(notification.updateToError).toHaveBeenCalledWith('progress-id', 'notification.create.error');
    });

    it('should update when in edit mode using the parameter code', () => {
      component.openEdit(parameter('A'));
      component.saveParameter(parameter('A', { value: 'changed' }));
      expect(parameterService.update).toHaveBeenCalledWith('A', expect.objectContaining({ code: 'A' }));
      expect(notification.updateToSuccess).toHaveBeenCalledWith('progress-id', 'notification.update.success');
    });

    it('should report an error when update fails', () => {
      parameterService.update.mockReturnValue(throwError(() => new Error('boom')));
      component.openEdit(parameter('A'));
      component.saveParameter(parameter('A'));
      expect(notification.updateToError).toHaveBeenCalledWith('progress-id', 'notification.update.error');
    });
  });

  // ─── Delete ─────────────────────────────────────────────────

  describe('delete flow', () => {
    it('confirmDelete should open the confirm dialog', () => {
      component.confirmDelete(parameter('A'));
      expect(component.showDeleteConfirm()).toBe(true);
      expect(component.deleteTarget()?.code).toBe('A');
    });

    it('cancelDelete should close and clear the target', () => {
      component.confirmDelete(parameter('A'));
      component.cancelDelete();
      expect(component.showDeleteConfirm()).toBe(false);
      expect(component.deleteTarget()).toBeNull();
    });

    it('executeDelete should delete by code and reload on success', () => {
      component.confirmDelete(parameter('A'));
      parameterService.findByCriteria.mockClear();
      component.executeDelete();
      expect(parameterService.delete).toHaveBeenCalledWith('A');
      expect(notification.updateToSuccess).toHaveBeenCalledWith('progress-id', 'notification.delete.success');
      expect(component.deleteTarget()).toBeNull();
      expect(parameterService.findByCriteria).toHaveBeenCalled();
    });

    it('executeDelete should go back to list when deleting from detail view', () => {
      component.viewDetail(parameter('A'));
      component.confirmDelete(parameter('A'));
      component.executeDelete();
      expect(component.viewMode()).toBe('list');
    });

    it('executeDelete should report an error when deletion fails', () => {
      parameterService.delete.mockReturnValue(throwError(() => new Error('boom')));
      component.confirmDelete(parameter('A'));
      component.executeDelete();
      expect(notification.updateToError).toHaveBeenCalledWith('progress-id', 'notification.delete.error');
      expect(component.deleteTarget()).toBeNull();
    });

    it('executeDelete should do nothing without a target', () => {
      component.deleteTarget.set(null);
      component.executeDelete();
      expect(parameterService.delete).not.toHaveBeenCalled();
    });
  });

  // ─── CSV export ─────────────────────────────────────────────

  describe('exportCsv', () => {
    beforeEach(() => {
      // Avoid real object URL / DOM download side effects in jsdom.
      // mockClear resets the call history so spies do not leak between tests.
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock').mockClear();
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {}).mockClear();
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {}).mockClear();
    });

    it('should build the CSV and notify success for non-empty data', () => {
      parameterService.findAllByCriteria.mockReturnValue(of([
        parameter('A', { description: 'with "quote"', value: 'x,y' }),
      ]));
      component.exportCsv();
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(notification.showSuccess).toHaveBeenCalledWith('notification.export.success');
    });

    it('should notify when there is nothing to export', () => {
      parameterService.findAllByCriteria.mockReturnValue(of([]));
      component.exportCsv();
      expect(URL.createObjectURL).not.toHaveBeenCalled();
      expect(notification.showError).toHaveBeenCalledWith('notification.export.empty');
    });

    it('should notify an error when the export fetch fails', () => {
      parameterService.findAllByCriteria.mockReturnValue(throwError(() => new Error('boom')));
      component.exportCsv();
      expect(notification.showError).toHaveBeenCalledWith('notification.export.error');
    });

    it('should forward active filters as export criteria', () => {
      component.filterCode.set('COD');
      component.filterType.set('DATE');
      component.exportCsv();
      expect(parameterService.findAllByCriteria).toHaveBeenCalledWith(
        { code: 'COD', type: 'DATE' }, ''
      );
    });
  });
});
