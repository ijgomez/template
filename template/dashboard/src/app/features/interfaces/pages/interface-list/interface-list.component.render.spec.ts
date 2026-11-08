import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { InterfaceListComponent } from './interface-list.component';
import { InterfaceService } from '../../../../core/services/interface.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { DateService } from '../../../../core/services/date.service';

/**
 * Template rendering tests for InterfaceListComponent. Unlike the logic spec,
 * the real template and child components are rendered so that bindings, the
 * list/detail views and the user interactions are exercised.
 */
describe('InterfaceListComponent (template)', () => {
  let fixture: ComponentFixture<InterfaceListComponent>;
  let component: InterfaceListComponent;

  const logs = [
    { id: 1, timestamp: '2026-01-01T10:00:00Z', operationType: 'GET', interfaceName: 'Gateway', status: 'SUCCESS' },
    {
      id: 2,
      timestamp: '2026-01-02T10:00:00Z',
      operationType: 'POST',
      interfaceName: 'Billing',
      status: 'ERROR',
      requestPayload: '{"a":1}',
      responsePayload: null,
      errorMessage: 'Timeout',
    },
  ];

  const interfaceService = {
    findAllConfigurations: (..._a: unknown[]) => of([]),
    findLogsByCriteria: (..._a: unknown[]) => of({ content: logs, page: { totalElements: 2 } }),
    findAllLogsByCriteria: (..._a: unknown[]) => of([]),
  };
  const notificationService = {
    showProgress: (..._a: unknown[]) => 'ntf-1',
    updateToSuccess: (..._a: unknown[]) => undefined,
    updateToError: (..._a: unknown[]) => undefined,
    dismiss: (..._a: unknown[]) => undefined,
  };
  const dateService = { toLocalString: (v: string) => `local:${v}`, toLocal: (v: string) => `local:${v}` };

  const byTestId = (id: string): HTMLElement | null =>
    (fixture.nativeElement as HTMLElement).querySelector(`[data-testid="${id}"]`);

  const render = async (): Promise<void> => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InterfaceListComponent],
      providers: [
        provideRouter([]),
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        { provide: InterfaceService, useValue: interfaceService },
        { provide: NotificationService, useValue: notificationService },
        { provide: DateService, useValue: dateService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InterfaceListComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('list view', () => {
    it('should render the title, filters, toolbar and table', async () => {
      await render();

      expect(byTestId('interface-list-title')).toBeTruthy();
      expect(byTestId('interface-list-filter-operation-type')).toBeTruthy();
      expect(byTestId('interface-list-filter-status')).toBeTruthy();
      expect(byTestId('interface-list-apply-filters')).toBeTruthy();
      expect(byTestId('interface-list-clear-filters')).toBeTruthy();
      expect(byTestId('interface-list-export-csv')).toBeTruthy();
      expect(byTestId('interface-list-table')).toBeTruthy();
    });

    it('should list all operation types and statuses in the filter dropdowns', async () => {
      await render();

      const types = byTestId('interface-list-filter-operation-type')!.querySelectorAll('option');
      const statuses = byTestId('interface-list-filter-status')!.querySelectorAll('option');

      expect(types).toHaveLength(component.operationTypes.length + 1);
      expect(statuses).toHaveLength(component.logStatuses.length + 1);
    });

    it('should render one row per log with the status badges', async () => {
      await render();

      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('Gateway');
      expect(text).toContain('Billing');
      expect(text).toContain('SUCCESS');
      expect(text).toContain('ERROR');
    });

    it('should disable the detail button until a row is selected', async () => {
      await render();
      const button = byTestId('interface-list-view-detail') as HTMLButtonElement;
      expect(button.disabled).toBe(true);

      component.selectRow(logs[0] as never);
      await render();

      expect(button.disabled).toBe(false);
    });

    it('should show the invalid range message and disable search', async () => {
      await render();
      component.filterDateFrom.set('2026-02-01');
      component.filterDateTo.set('2026-01-01');
      await render();

      expect((byTestId('interface-list-apply-filters') as HTMLButtonElement).disabled).toBe(true);
      expect((fixture.nativeElement as HTMLElement).querySelector('small.text-danger')).toBeTruthy();
    });

    it('should keep rendering the table with no rows when the backend fails', async () => {
      vi.spyOn(interfaceService, 'findLogsByCriteria').mockReturnValue(throwError(() => new Error('boom')));

      await render();

      expect(component.logs()).toEqual([]);
      expect(byTestId('interface-list-table')).toBeTruthy();
    });
  });

  describe('interactions', () => {
    it('should reload when the search button is clicked', async () => {
      await render();
      const spy = vi.spyOn(interfaceService, 'findLogsByCriteria');

      byTestId('interface-list-apply-filters')!.click();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should clear the filters when the clear button is clicked', async () => {
      await render();
      component.filterStatus.set('ERROR');

      byTestId('interface-list-clear-filters')!.click();

      expect(component.filterStatus()).toBe('');
    });

    it('should export when the CSV button is clicked', async () => {
      await render();
      const spy = vi.spyOn(interfaceService, 'findAllLogsByCriteria');

      byTestId('interface-list-export-csv')!.click();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should update the filter signal when the status select changes', async () => {
      await render();
      const select = byTestId('interface-list-filter-status') as HTMLSelectElement;

      select.value = 'ERROR';
      select.dispatchEvent(new Event('change'));

      expect(component.filterStatus()).toBe('ERROR');
    });

    it('should update the filter signal when the operation type select changes', async () => {
      await render();
      const select = byTestId('interface-list-filter-operation-type') as HTMLSelectElement;

      select.value = 'POST';
      select.dispatchEvent(new Event('change'));

      expect(component.filterOperationType()).toBe('POST');
    });

    it('should open the detail view from the toolbar button', async () => {
      vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      await render();
      component.selectRow(logs[1] as never);
      await render();

      byTestId('interface-list-view-detail')!.click();
      await render();

      expect(component.viewMode()).toBe('detail');
      expect(byTestId('interface-list-back-to-list')).toBeTruthy();
    });
  });

  describe('detail view', () => {
    const openDetail = async (log: (typeof logs)[number]): Promise<void> => {
      vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      await render();
      component.viewDetail(log as never);
      await render();
    };

    it('should render the log fields and the error message', async () => {
      await openDetail(logs[1]);

      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('Billing');
      expect(text).toContain('POST');
      expect(text).toContain('{"a":1}');
      expect(text).toContain('Timeout');
    });

    it('should show a dash for missing payloads and hide the error block', async () => {
      await openDetail(logs[0]);

      const pres = (fixture.nativeElement as HTMLElement).querySelectorAll('pre');
      expect(pres).toHaveLength(2);
      expect(pres[0].textContent).toContain('-');
      expect((fixture.nativeElement as HTMLElement).querySelector('.text-danger.form-control-plaintext')).toBeNull();
    });

    it('should go back to the list from the back button', async () => {
      await openDetail(logs[0]);

      byTestId('interface-list-back-to-list')!.click();
      await render();

      expect(component.viewMode()).toBe('list');
      expect(byTestId('interface-list-table')).toBeTruthy();
    });
  });
});
