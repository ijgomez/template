import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { ConfigurationListComponent } from './configuration-list.component';
import { InterfaceService } from '../../../../core/services/interface.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CsvExportService } from '../../../../core/services/csv-export.service';
import { DateService } from '../../../../core/services/date.service';
import { InterfaceConfig } from '../../../../core/models/interface.model';

/**
 * Unit tests for ConfigurationListComponent focused on component logic (state,
 * data load, filters, pagination, sorting, selection, detail navigation, export)
 * with all services stubbed. The template is replaced by an empty one to avoid
 * rendering the full view and the child form.
 */
describe('ConfigurationListComponent', () => {
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

  const interfaceService = {
    findAllConfigurations: (..._a: unknown[]) => of([config, otherConfig]),
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
      imports: [ConfigurationListComponent],
      providers: [
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        { provide: InterfaceService, useValue: interfaceService },
        { provide: NotificationService, useValue: notificationService },
        { provide: CsvExportService, useValue: csvExportService },
        { provide: DateService, useValue: dateService },
      ],
    })
      .overrideComponent(ConfigurationListComponent, { set: { template: '' } })
      .compileComponents();

    const fixture = TestBed.createComponent(ConfigurationListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load configurations and clear loading', () => {
      component.ngOnInit();
      expect(component.configurations()).toEqual([config, otherConfig]);
      expect(component.totalElements()).toBe(2);
      expect(component.isLoading()).toBe(false);
    });

    it('should stop loading on error', () => {
      interfaceService.findAllConfigurations = () => throwError(() => new Error('boom'));
      component.ngOnInit();
      expect(component.isLoading()).toBe(false);
      interfaceService.findAllConfigurations = () => of([config, otherConfig]);
    });
  });

  describe('filters', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('applyFilters should reset page and selection', () => {
      component.currentPage.set(2);
      component.selectRow(config);

      component.applyFilters();

      expect(component.currentPage()).toBe(0);
      expect(component.selectedRow()).toBeNull();
    });

    it('clearFilters should reset the three filters, page and selection', () => {
      component.filterName.set('Pay');
      component.filterProtocol.set('REST');
      component.filterStatus.set('ACTIVE');
      component.currentPage.set(2);
      component.selectRow(config);

      component.clearFilters();

      expect(component.filterName()).toBe('');
      expect(component.filterProtocol()).toBe('');
      expect(component.filterStatus()).toBe('');
      expect(component.currentPage()).toBe(0);
      expect(component.selectedRow()).toBeNull();
    });

    it('filteredConfigs should filter by name', () => {
      component.filterName.set('payment');
      expect(component.filteredConfigs()).toEqual([config]);
    });

    it('filteredConfigs should filter by protocol', () => {
      component.filterProtocol.set('LDAP');
      expect(component.filteredConfigs()).toEqual([otherConfig]);
    });

    it('filteredConfigs should filter by status', () => {
      component.filterStatus.set('INACTIVE');
      expect(component.filteredConfigs()).toEqual([otherConfig]);
    });
  });

  describe('pagination and sorting', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('goToPage should ignore out-of-range pages', () => {
      component.currentPage.set(0);
      component.goToPage(-1);
      component.goToPage(5);
      expect(component.currentPage()).toBe(0);
    });

    it('changePageSize should set size and reset page', () => {
      component.currentPage.set(1);
      component.changePageSize(50);
      expect(component.pageSize()).toBe(50);
      expect(component.currentPage()).toBe(0);
    });

    it('onSort should record column and direction and reset page', () => {
      component.currentPage.set(2);
      component.onSort({ column: 'name', direction: 'asc' });
      expect(component.sortColumn()).toBe('name');
      expect(component.sortDirection()).toBe('asc');
      expect(component.currentPage()).toBe(0);
    });
  });

  describe('row selection', () => {
    it('selectRow should select and toggle-off the same row', () => {
      component.selectRow(config);
      expect(component.selectedRow()).toEqual(config);
      component.selectRow(config);
      expect(component.selectedRow()).toBeNull();
    });
  });

  describe('detail navigation', () => {
    it('viewDetail should set selectedConfig and switch to detail', () => {
      component.viewDetail(config);
      expect(component.selectedConfig()).toEqual(config);
      expect(component.viewMode()).toBe('detail');
    });

    it('viewSelectedDetail should open the selected row detail', () => {
      component.selectRow(config);
      component.viewSelectedDetail();
      expect(component.selectedConfig()).toEqual(config);
      expect(component.viewMode()).toBe('detail');
    });

    it('viewSelectedDetail should do nothing without a selection', () => {
      component.selectedRow.set(null);
      component.viewSelectedDetail();
      expect(component.viewMode()).toBe('list');
    });

    it('backToList should return to the list and clear the selected config', () => {
      component.viewDetail(config);
      component.backToList();
      expect(component.viewMode()).toBe('list');
      expect(component.selectedConfig()).toBeNull();
    });
  });

  describe('exportCsv', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should export the filtered rows to CSV', () => {
      let exported: { headers: string[]; rows: string[][]; name: string } | undefined;
      csvExportService.export = (...args: unknown[]) => {
        exported = { headers: args[0] as string[], rows: args[1] as string[][], name: args[2] as string };
      };

      component.exportCsv();

      expect(exported).toBeTruthy();
      expect(exported!.name).toBe('interface-configurations');
      expect(exported!.rows.length).toBe(2);
      expect(exported!.rows[0][0]).toBe('Payment Gateway');
      csvExportService.export = () => undefined;
    });

    it('should skip export when there is nothing to export', () => {
      component.configurations.set([]);
      let called = false;
      csvExportService.export = () => {
        called = true;
      };

      component.exportCsv();

      expect(called).toBe(false);
      csvExportService.export = () => undefined;
    });
  });
});
