import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

import { ConfigurationListComponent } from './configuration-list.component';
import { InterfaceService } from '../../../../core/services/interface.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CsvExportService } from '../../../../core/services/csv-export.service';
import { DateService } from '../../../../core/services/date.service';
import { InterfaceConfig } from '../../../../core/models/interface.model';

/**
 * Template rendering tests for ConfigurationListComponent. The real template
 * and child components are rendered (filters, toolbar, table and the read-only
 * configuration form) while all services are stubbed.
 */
describe('ConfigurationListComponent (template)', () => {
  let fixture: ComponentFixture<ConfigurationListComponent>;
  let component: ConfigurationListComponent;

  const config: InterfaceConfig = {
    id: 1,
    name: 'Payment Gateway',
    description: 'Payment integration',
    url: 'https://api.example.com/pay',
    protocol: 'REST',
    checkFrequency: 60,
    status: 'ACTIVE',
    createdAt: '2026-01-01T10:00:00Z',
    lastModifiedAt: '2026-01-02T10:00:00Z',
  };
  const otherConfig: InterfaceConfig = {
    id: 2,
    name: 'Directory Service',
    description: 'LDAP directory',
    url: 'ldap://dir.example.com',
    protocol: 'LDAP',
    checkFrequency: 120,
    status: 'INACTIVE',
    createdAt: '2026-01-01T10:00:00Z',
    lastModifiedAt: '2026-01-02T10:00:00Z',
  };
  const errorConfig: InterfaceConfig = { ...config, id: 3, name: 'Broken', status: 'ERROR' };

  const interfaceService = {
    findAllConfigurations: (..._a: unknown[]): Observable<unknown> => of([config, otherConfig, errorConfig]),
    findConfigurationById: (..._a: unknown[]): Observable<unknown> => of(config),
  };
  const notificationService = {
    showProgress: (..._a: unknown[]) => 'ntf-1',
    updateToSuccess: (..._a: unknown[]) => undefined,
    updateToError: (..._a: unknown[]) => undefined,
    dismiss: (..._a: unknown[]) => undefined,
  };
  const csvExportService = { export: (..._a: unknown[]) => undefined };
  const dateService = { toLocalString: (v: string) => `local:${v}`, toLocal: (v: string) => `local:${v}` };

  const el = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const byTestId = (id: string): HTMLElement | null => el().querySelector(`[data-testid="${id}"]`);

  const render = async (): Promise<void> => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigurationListComponent],
      providers: [
        provideRouter([]),
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        { provide: InterfaceService, useValue: interfaceService },
        { provide: NotificationService, useValue: notificationService },
        { provide: CsvExportService, useValue: csvExportService },
        { provide: DateService, useValue: dateService },
      ],
    }).compileComponents();

    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(ConfigurationListComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('list view', () => {
    it('should render the title, filters, toolbar and table', async () => {
      await render();

      expect(byTestId('config-filter-form')).toBeTruthy();
      expect(byTestId('filter-name')).toBeTruthy();
      expect(byTestId('filter-status')).toBeTruthy();
      expect(byTestId('btn-filter-search')).toBeTruthy();
      expect(byTestId('btn-filter-clear')).toBeTruthy();
      expect(byTestId('btn-export')).toBeTruthy();
      expect(byTestId('configuration-table')).toBeTruthy();
    });

    it('should render the configurations with protocol, url, status and frequency', async () => {
      await render();

      const text = el().textContent ?? '';
      expect(text).toContain('Payment Gateway');
      expect(text).toContain('Directory Service');
      expect(text).toContain('https://api.example.com/pay');
      expect(text).toContain('ACTIVE');
      expect(text).toContain('INACTIVE');
      expect(text).toContain('ERROR');
      expect(text).toContain('60s');
    });

    it('should disable the detail button until a row is selected', async () => {
      await render();
      const detail = byTestId('btn-view-detail') as HTMLElement;
      const button = (detail.querySelector('button') ?? detail) as HTMLButtonElement;
      expect(button.disabled).toBe(true);

      component.selectRow(config);
      await render();

      expect(button.disabled).toBe(false);
    });
  });

  describe('filters', () => {
    it('should filter the rows when typing a name', async () => {
      await render();
      const input = byTestId('filter-name') as HTMLInputElement;

      input.value = 'directory';
      input.dispatchEvent(new Event('input'));
      await render();

      expect(component.filterName()).toBe('directory');
      expect(el().textContent).toContain('Directory Service');
      expect(el().textContent).not.toContain('Payment Gateway');
    });

    it('should filter the rows when choosing a status', async () => {
      await render();
      const select = byTestId('filter-status') as HTMLSelectElement;

      select.value = 'ERROR';
      select.dispatchEvent(new Event('change'));
      await render();

      expect(component.filterStatus()).toBe('ERROR');
      expect(component.filteredConfigs()).toEqual([errorConfig]);
    });

    it('should apply the filters on submit', async () => {
      await render();
      component.currentPage.set(1);

      (byTestId('config-filter-form') as HTMLFormElement).dispatchEvent(new Event('submit'));

      expect(component.currentPage()).toBe(0);
    });

    it('should clear the filters from the clear button', async () => {
      await render();
      component.filterName.set('pay');

      byTestId('btn-filter-clear')!.click();
      await render();

      expect(component.filterName()).toBe('');
      expect(component.filteredConfigs()).toHaveLength(3);
    });
  });

  describe('export', () => {
    it('should export the configurations from the toolbar button', async () => {
      await render();
      const spy = vi.spyOn(csvExportService, 'export');

      byTestId('btn-export')!.click();

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('detail view', () => {
    it('should render the read-only form and go back to the list', async () => {
      await render();

      component.viewDetail(config);
      await render();

      expect(component.viewMode()).toBe('detail');
      expect(el().querySelector('app-configuration-form')).toBeTruthy();
      expect(byTestId('configuration-table')).toBeNull();

      component.backToList();
      await render();

      expect(component.viewMode()).toBe('list');
      expect(byTestId('configuration-table')).toBeTruthy();
    });
  });
});
