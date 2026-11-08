import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { Observable, of, throwError } from 'rxjs';

import { InterfaceListComponent } from './interface-list.component';
import { InterfaceService } from '../../../../core/services/interface.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { DateService } from '../../../../core/services/date.service';

/**
 * Unit tests for InterfaceListComponent focused on component logic (initial
 * view state, data load on init and filter reset) with all services stubbed.
 * The template is replaced by an empty one to avoid rendering the full view.
 */
describe('InterfaceListComponent', () => {
  let component: InterfaceListComponent;

  const interfaceService = {
    findAllConfigurations: (..._a: unknown[]): Observable<unknown> => of([]),
    findLogsByCriteria: (..._a: unknown[]): Observable<unknown> => of({ content: [], page: { totalElements: 0 } }),
    findAllLogsByCriteria: (..._a: unknown[]): Observable<unknown> => of([]),
  };
  const notificationService = {
    showProgress: (..._a: unknown[]) => 'ntf-1',
    updateToSuccess: (..._a: unknown[]) => undefined,
    updateToError: (..._a: unknown[]) => undefined,
    dismiss: (..._a: unknown[]) => undefined,
  };
  const dateService = { toLocalString: (v: string) => `local:${v}` };
  const authService = {};

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InterfaceListComponent],
      providers: [
        provideRouter([]),
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        { provide: InterfaceService, useValue: interfaceService },
        { provide: NotificationService, useValue: notificationService },
        { provide: DateService, useValue: dateService },
        { provide: AuthService, useValue: authService },
      ],
    })
      .overrideComponent(InterfaceListComponent, { set: { template: '' } })
      .compileComponents();

    const fixture = TestBed.createComponent(InterfaceListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load without throwing, clear loading and start in list view', () => {
      // Act
      component.ngOnInit();

      // Assert
      expect(component.isLoading()).toBe(false);
      expect(component.viewMode()).toBe('list');
    });
  });

  describe('clearFilters', () => {
    it('should reset all filter signals and the current page', () => {
      // Arrange
      component.filterDateFrom.set('2026-01-01');
      component.filterDateTo.set('2026-01-31');
      component.filterOperationType.set('POST');
      component.filterInterfaceName.set('FTP');
      component.filterStatus.set('ERROR');
      component.currentPage.set(2);

      // Act
      component.clearFilters();

      // Assert
      expect(component.filterDateFrom()).toBe('');
      expect(component.filterDateTo()).toBe('');
      expect(component.filterOperationType()).toBe('');
      expect(component.filterInterfaceName()).toBe('');
      expect(component.filterStatus()).toBe('');
      expect(component.currentPage()).toBe(0);
    });
  });

  describe('applyFilters with invalid date range', () => {
    it('should not reload when dateFrom is after dateTo', () => {
      // Arrange
      component.filterDateFrom.set('2026-02-01');
      component.filterDateTo.set('2026-01-01');
      component.currentPage.set(3);

      // Act
      component.applyFilters();

      // Assert
      expect(component.hasInvalidDateRange()).toBe(true);
      expect(component.currentPage()).toBe(3);
    });
  });

  describe('deep linking (URL sub-view state)', () => {
    const log = { id: 7, interfaceName: 'Gateway', status: 'SUCCESS' } as unknown as Parameters<InterfaceListComponent['viewDetail']>[0];

    it('viewDetail should switch to detail mode and sync the URL with view=detail and the log id', () => {
      const spy = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      component.viewDetail(log);
      expect(component.viewMode()).toBe('detail');
      expect(spy).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: { view: 'detail', id: 7 } }));
    });

    it('backToList should clear the sub-view query params', () => {
      const spy = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      component.backToList();
      expect(component.viewMode()).toBe('list');
      expect(spy).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: {} }));
    });
  });

  describe('loadLogs', () => {
    const logPage = {
      content: [
        { id: 1, timestamp: '2026-01-01T10:00:00Z', operationType: 'GET', interfaceName: 'Gateway', status: 'SUCCESS' },
        { id: 2, timestamp: '2026-01-02T10:00:00Z', operationType: 'POST', interfaceName: 'Billing', status: 'ERROR' },
      ],
      page: { totalElements: 25 },
    };

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should store the page content and totals and dismiss the progress', () => {
      vi.spyOn(interfaceService, 'findLogsByCriteria').mockReturnValue(of(logPage));
      const dismiss = vi.spyOn(notificationService, 'dismiss');

      component.loadLogs();

      expect(component.logs()).toHaveLength(2);
      expect(component.totalElements()).toBe(25);
      expect(component.totalPages()).toBe(3);
      expect(component.isLoading()).toBe(false);
      expect(dismiss).toHaveBeenCalledWith('ntf-1');
    });

    it('should notify an error and stop loading when the backend fails', () => {
      vi.spyOn(interfaceService, 'findLogsByCriteria').mockReturnValue(throwError(() => new Error('boom')));
      const updateToError = vi.spyOn(notificationService, 'updateToError');

      component.loadLogs();

      expect(component.isLoading()).toBe(false);
      expect(updateToError).toHaveBeenCalledWith('ntf-1', 'notification.error');
    });

    it('should send only the active filters as criteria', () => {
      const spy = vi.spyOn(interfaceService, 'findLogsByCriteria').mockReturnValue(of(logPage));
      component.filterOperationType.set('POST');
      component.filterInterfaceName.set('Billing');
      component.filterStatus.set('ERROR');
      component.filterDateFrom.set('2026-01-01');
      component.filterDateTo.set('2026-01-31');

      component.loadLogs();

      expect(spy.mock.calls[0][0]).toEqual({
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31',
        operationType: 'POST',
        interfaceName: 'Billing',
        status: 'ERROR',
      });
    });

    it('should show the pagination helpers for the loaded page', () => {
      vi.spyOn(interfaceService, 'findLogsByCriteria').mockReturnValue(of(logPage));
      component.loadLogs();
      component.currentPage.set(1);

      expect(component.showingFrom()).toBe(11);
      expect(component.showingTo()).toBe(20);
    });

    it('should report zero for showingFrom when there are no results', () => {
      expect(component.showingFrom()).toBe(0);
      expect(component.showingTo()).toBe(0);
    });
  });

  describe('applyFilters with a valid range', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should reset the page and reload', () => {
      const spy = vi.spyOn(interfaceService, 'findLogsByCriteria');
      component.currentPage.set(3);

      component.applyFilters();

      expect(component.currentPage()).toBe(0);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should not call the backend when the range is invalid', () => {
      const spy = vi.spyOn(interfaceService, 'findLogsByCriteria');
      component.filterDateFrom.set('2026-02-01');
      component.filterDateTo.set('2026-01-01');

      component.applyFilters();

      expect(spy).not.toHaveBeenCalled();
      expect(component.isFilterDisabled()).toBe(true);
    });
  });

  describe('pagination and sorting', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('goToPage should load a valid page', () => {
      const spy = vi.spyOn(interfaceService, 'findLogsByCriteria');
      component.totalElements.set(30);

      component.goToPage(2);

      expect(component.currentPage()).toBe(2);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('goToPage should ignore out-of-range pages', () => {
      const spy = vi.spyOn(interfaceService, 'findLogsByCriteria');
      component.totalElements.set(30);

      component.goToPage(-1);
      component.goToPage(3);

      expect(component.currentPage()).toBe(0);
      expect(spy).not.toHaveBeenCalled();
    });

    it('changePageSize should convert the size, reset the page and reload', () => {
      const spy = vi.spyOn(interfaceService, 'findLogsByCriteria');
      component.currentPage.set(2);

      component.changePageSize('50');

      expect(component.pageSize()).toBe(50);
      expect(component.currentPage()).toBe(0);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('onSort should build the sort param and reload from page 0', () => {
      const spy = vi.spyOn(interfaceService, 'findLogsByCriteria');
      component.currentPage.set(2);

      component.onSort({ column: 'status', direction: 'desc' });

      expect(component.sortParam()).toBe('status,desc');
      expect(component.currentPage()).toBe(0);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('onSort should clear the sort param when direction is empty', () => {
      component.sortParam.set('status,desc');

      component.onSort({ column: 'status', direction: '' });

      expect(component.sortParam()).toBe('');
    });
  });

  describe('selectRow', () => {
    const log = { id: 3, interfaceName: 'Gateway' } as unknown as Parameters<InterfaceListComponent['selectRow']>[0];

    it('should select a row and toggle it off when selected again', () => {
      component.selectRow(log);
      expect(component.selectedLog()).toEqual(log);

      component.selectRow(log);
      expect(component.selectedLog()).toBeNull();
    });
  });

  describe('restoring the view from the URL', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should open the detail when the log is in the loaded page', async () => {
      vi.spyOn(interfaceService, 'findLogsByCriteria').mockReturnValue(
        of({ content: [{ id: 7, interfaceName: 'Gateway', status: 'SUCCESS' }], page: { totalElements: 1 } }),
      );
      await TestBed.inject(Router).navigate([], { queryParams: { view: 'detail', id: 7 } });

      component.ngOnInit();

      expect(component.viewMode()).toBe('detail');
      expect(component.selectedLog()?.id).toBe(7);
    });

    it('should fall back to the list URL when the log is not in the loaded page', async () => {
      await TestBed.inject(Router).navigate([], { queryParams: { view: 'detail', id: 99 } });
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

      component.ngOnInit();

      expect(component.viewMode()).toBe('list');
      expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: {} }));
    });
  });

  describe('exportCsv', () => {
    const exportData = [
      { id: 1, timestamp: '2026-01-01T10:00:00Z', operationType: 'GET', interfaceName: 'Gateway, main', status: 'SUCCESS' },
      { id: 2, timestamp: '', operationType: 'POST', interfaceName: 'Say "hi"', status: 'ERROR' },
    ];

    let createObjectURL: ReturnType<typeof vi.fn>;
    let revokeObjectURL: ReturnType<typeof vi.fn>;
    let click: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      createObjectURL = vi.fn().mockReturnValue('blob:csv');
      revokeObjectURL = vi.fn();
      URL.createObjectURL = createObjectURL as unknown as typeof URL.createObjectURL;
      URL.revokeObjectURL = revokeObjectURL as unknown as typeof URL.revokeObjectURL;
      click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should download the CSV and notify success', () => {
      vi.spyOn(interfaceService, 'findAllLogsByCriteria').mockReturnValue(of(exportData as never));
      const success = vi.spyOn(notificationService, 'updateToSuccess');

      component.exportCsv();

      expect(createObjectURL).toHaveBeenCalledTimes(1);
      expect(click).toHaveBeenCalledTimes(1);
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:csv');
      expect(success).toHaveBeenCalledWith('ntf-1', 'notification.export.success');
    });

    it('should escape commas and quotes in the CSV content', async () => {
      vi.spyOn(interfaceService, 'findAllLogsByCriteria').mockReturnValue(of(exportData as never));

      component.exportCsv();

      const blob = createObjectURL.mock.calls[0][0] as Blob;
      const content = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsText(blob);
      });
      expect(content).toContain('"Gateway, main"');
      expect(content).toContain('"Say ""hi"""');
    });

    it('should notify an error when there is nothing to export', () => {
      vi.spyOn(interfaceService, 'findAllLogsByCriteria').mockReturnValue(of([]));
      const updateToError = vi.spyOn(notificationService, 'updateToError');

      component.exportCsv();

      expect(updateToError).toHaveBeenCalledWith('ntf-1', 'notification.export.empty');
      expect(createObjectURL).not.toHaveBeenCalled();
    });

    it('should notify an error when the backend fails', () => {
      vi.spyOn(interfaceService, 'findAllLogsByCriteria').mockReturnValue(throwError(() => new Error('boom')));
      const updateToError = vi.spyOn(notificationService, 'updateToError');

      component.exportCsv();

      expect(updateToError).toHaveBeenCalledWith('ntf-1', 'notification.export.error');
    });

    it('should notify an error when building the file fails', () => {
      vi.spyOn(interfaceService, 'findAllLogsByCriteria').mockReturnValue(of(exportData as never));
      createObjectURL.mockImplementation(() => {
        throw new Error('no blob');
      });
      const updateToError = vi.spyOn(notificationService, 'updateToError');

      component.exportCsv();

      expect(updateToError).toHaveBeenCalledWith('ntf-1', 'notification.export.error');
    });
  });
});
