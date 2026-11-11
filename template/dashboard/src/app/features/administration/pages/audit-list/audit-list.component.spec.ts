import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { Observable, of, throwError } from 'rxjs';
import { AuditListComponent } from './audit-list.component';
import { AuditService } from '../../../../core/services/audit.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { DateService } from '../../../../core/services/date.service';
import { CsvExportService } from '../../../../core/services/csv-export.service';
import { AuditCriteria, AuditLog } from '../../../../core/models/audit.model';

/**
 * Unit tests for AuditListComponent focused on component logic (load, filters,
 * selection/detail navigation and CSV export) with all services stubbed.
 * The template is replaced by an empty one to avoid rendering the full view.
 */
describe('AuditListComponent', () => {
  let component: AuditListComponent;

  const log = (id: number): AuditLog => ({
    id,
    timestamp: '2026-10-25T08:00:00Z',
    username: 'admin',
    operationType: 'EXECUTE',
    section: 'SECURITY',
    entityId: String(id),
    entityName: 'User',
    detail: 'login',
  });

  const auditService = {
    findByCriteria: (..._a: unknown[]): Observable<unknown> =>
      of({ content: [log(1), log(2)], page: { totalElements: 2 } }),
    findAllByCriteria: (..._a: unknown[]): Observable<AuditLog[]> => of([log(1)]),
  };
  const notificationService = {
    showProgress: (..._a: unknown[]) => 'ntf-1',
    updateToSuccess: (..._a: unknown[]) => undefined,
    updateToError: (..._a: unknown[]) => undefined,
    dismiss: (..._a: unknown[]) => undefined,
  };
  const csvExportService = { export: (..._a: unknown[]) => undefined };
  const dateService = { toLocalString: (v: string) => `local:${v}` };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditListComponent],
      providers: [
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        { provide: AuditService, useValue: auditService },
        { provide: NotificationService, useValue: notificationService },
        { provide: CsvExportService, useValue: csvExportService },
        { provide: DateService, useValue: dateService },
        { provide: AuthService, useValue: {} },
      ],
    })
      .overrideComponent(AuditListComponent, { set: { template: '' } })
      .compileComponents();

    component = TestBed.createComponent(AuditListComponent).componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should load the first page on init and start in list view', () => {
    // Act
    component.ngOnInit();

    // Assert
    expect(component.auditLogs().length).toBe(2);
    expect(component.totalElements()).toBe(2);
    expect(component.isLoading()).toBe(false);
    expect(component.viewMode()).toBe('list');
  });

  it('should notify an error when the load fails', () => {
    // Arrange
    vi.spyOn(auditService, 'findByCriteria').mockReturnValue(throwError(() => new Error('boom')));
    const updateToError = vi.spyOn(notificationService, 'updateToError');

    // Act
    component.loadAuditLogs();

    // Assert
    expect(component.isLoading()).toBe(false);
    expect(updateToError).toHaveBeenCalledWith('ntf-1', 'notification.error');
  });

  describe('filters', () => {
    it('should send the active filters, including the local date range, and go back to page 0', () => {
      // Arrange
      const find = vi.spyOn(auditService, 'findByCriteria');
      component.currentPage.set(3);
      component.filterUsername.set('adm');
      component.filterOperationType.set('EXECUTE');
      component.filterSection.set('SECURITY');
      component.filterDateFrom.set('2026-10-01');
      component.filterDateTo.set('2026-10-25');

      // Act
      component.applyFilters();

      // Assert
      const criteria = find.mock.calls.at(-1)![0] as AuditCriteria;
      expect(criteria).toEqual({
        username: 'adm',
        operationType: 'EXECUTE',
        section: 'SECURITY',
        dateFrom: '2026-10-01',
        dateTo: '2026-10-25',
      });
      expect(find.mock.calls.at(-1)![1]).toBe(0);
      expect(component.currentPage()).toBe(0);
    });

    it('should flag an inverted date range and skip the query', () => {
      // Arrange
      const find = vi.spyOn(auditService, 'findByCriteria');
      component.filterDateFrom.set('2026-02-10');
      component.filterDateTo.set('2026-02-01');

      // Act
      component.applyFilters();

      // Assert
      expect(component.hasInvalidDateRange()).toBe(true);
      expect(component.isFilterDisabled()).toBe(true);
      expect(find).not.toHaveBeenCalled();
    });

    it('should reset every filter and reload without criteria on clear', () => {
      // Arrange
      const find = vi.spyOn(auditService, 'findByCriteria');
      component.filterUsername.set('adm');
      component.filterOperationType.set('EXECUTE');
      component.filterSection.set('SECURITY');
      component.filterDateFrom.set('2026-10-01');
      component.filterDateTo.set('2026-10-25');
      component.currentPage.set(2);

      // Act
      component.clearFilters();

      // Assert
      expect(component.filterUsername()).toBe('');
      expect(component.filterOperationType()).toBe('');
      expect(component.filterSection()).toBe('');
      expect(component.filterDateFrom()).toBe('');
      expect(component.filterDateTo()).toBe('');
      expect(component.currentPage()).toBe(0);
      expect(find.mock.calls.at(-1)![0]).toEqual({});
    });
  });

  describe('selection and detail', () => {
    it('should toggle the selected row', () => {
      component.selectRow(log(1));
      expect(component.selectedRow()?.id).toBe(1);

      component.selectRow(log(1));
      expect(component.selectedRow()).toBeNull();
    });

    it('should open the detail of the selected row', () => {
      // Arrange
      component.selectRow(log(2));

      // Act
      component.viewSelected();

      // Assert
      expect(component.viewMode()).toBe('detail');
      expect(component.selectedAuditLog()?.id).toBe(2);
    });

    it('should not open the detail when nothing is selected', () => {
      component.viewSelected();

      expect(component.viewMode()).toBe('list');
    });

    it('should restore the list and clear the selection on back (AC3.4)', () => {
      // Arrange
      component.selectRow(log(1));
      component.viewSelected();

      // Act
      component.backToList();

      // Assert
      expect(component.viewMode()).toBe('list');
      expect(component.selectedAuditLog()).toBeNull();
      expect(component.selectedRow()).toBeNull();
    });
  });

  describe('exportCsv', () => {
    it('should export all filtered rows ignoring pagination', () => {
      // Arrange
      const findAll = vi.spyOn(auditService, 'findAllByCriteria');
      const exportSpy = vi.spyOn(csvExportService, 'export');
      component.filterUsername.set('admin');

      // Act
      component.exportCsv();

      // Assert
      expect(findAll).toHaveBeenCalledWith({ username: 'admin' }, '');
      const [headers, rows, prefix] = exportSpy.mock.calls[0] as [string[], string[][], string];
      expect(headers.length).toBe(7);
      expect(rows.length).toBe(1);
      expect(prefix).toBe('audit');
    });

    it('should notify and skip the file when there is no data to export', () => {
      // Arrange
      vi.spyOn(auditService, 'findAllByCriteria').mockReturnValue(of([]));
      const exportSpy = vi.spyOn(csvExportService, 'export');
      const updateToError = vi.spyOn(notificationService, 'updateToError');

      // Act
      component.exportCsv();

      // Assert
      expect(updateToError).toHaveBeenCalledWith('ntf-1', 'notification.export.empty');
      expect(exportSpy).not.toHaveBeenCalled();
    });
  });
});
