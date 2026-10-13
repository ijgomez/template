import { TestBed } from '@angular/core/testing';
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
      component.filterInterfaceId.set('5');
      component.filterStatus.set('ERROR');
      component.currentPage.set(2);

      // Act
      component.clearFilters();

      // Assert
      expect(component.filterDateFrom()).toBe('');
      expect(component.filterDateTo()).toBe('');
      expect(component.filterOperationType()).toBe('');
      expect(component.filterInterfaceId()).toBe('');
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
});
