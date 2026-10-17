import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

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
    findAllConfigurations: (..._a: unknown[]) => of([]),
    findLogsByCriteria: (..._a: unknown[]) => of({ content: [], page: { totalElements: 0 } }),
    findAllLogsByCriteria: (..._a: unknown[]) => of([]),
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
});
