import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import * as fc from 'fast-check';

import { ParametersComponent } from './parameters.component';
import { ParameterService } from '../../../core/services/parameter.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

/**
 * Property-based test for bug condition exploration:
 * Form styling diverges from reference pattern in Parameters component.
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 1.12, 1.13, 1.14, 1.15**
 *
 * Property 1 (Bug Condition): For any form view mode (create/edit) in the Parameters component,
 * the form SHALL render with: tp-filter-bar container, form-control-sm inputs, form-label-sm labels,
 * form-select-sm selects, row g-2 mb-3 layout, h6 section heading, and btn-sm buttons.
 *
 * IMPORTANT: This test is expected to FAIL on unfixed code — failure confirms the bug exists.
 */
describe('ParametersComponent - Property 1: Bug Condition - Form Styling Matches Reference Pattern', () => {
  /**
   * Arbitrary for form view modes in Parameters component.
   */
  const formViewModeArb = fc.constantFrom('create' as const, 'edit' as const);

  function createFixture(viewMode: 'create' | 'edit'): ComponentFixture<ParametersComponent> {
    const parameterServiceMock: Partial<ParameterService> = {
      findByCriteria: () => of({ content: [], page: { totalElements: 0, totalPages: 0, size: 10, number: 0 } } as any),
    };

    const authServiceMock: Partial<AuthService> = {
      hasAction: () => true,
      getCurrentUser: () => ({
        username: 'testuser',
        profile: 'ADMIN',
        actions: ['SYSTEM_PARAMETER_READ', 'SYSTEM_PARAMETER_WRITE'],
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      }),
    };

    const notificationServiceMock: Partial<NotificationService> = {
      showSuccess: () => '',
      showProgress: () => '',
      updateToSuccess: () => {},
      updateToError: () => {},
      showError: () => '',
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ParametersComponent],
      providers: [
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        { provide: ParameterService, useValue: parameterServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
      ],
    });

    const fixture = TestBed.createComponent(ParametersComponent);
    const component = fixture.componentInstance;

    // Set the form mode
    if (viewMode === 'create') {
      component.openCreate();
    } else {
      component.openEdit({
        id: 1,
        code: 'TEST_PARAM',
        description: 'Test parameter',
        value: 'test-value',
        type: 'STRING',
        createdAt: '2024-01-01',
        lastModifiedAt: '2024-01-02',
      });
    }

    fixture.detectChanges();
    return fixture;
  }

  it('should have tp-filter-bar container in form view (not card > card-body)', () => {
    fc.assert(
      fc.property(formViewModeArb, (viewMode) => {
        const fixture = createFixture(viewMode);
        const el = fixture.nativeElement as HTMLElement;

        const filterBar = el.querySelector('.tp-filter-bar');
        expect(
          filterBar,
          `Expected .tp-filter-bar container in '${viewMode}' mode, but found none. ` +
          `Current structure uses .card > .card-body instead.`,
        ).not.toBeNull();
      }),
      { numRuns: 4 },
    );
  });

  it('should have form-control-sm on all text inputs', () => {
    fc.assert(
      fc.property(formViewModeArb, (viewMode) => {
        const fixture = createFixture(viewMode);
        const el = fixture.nativeElement as HTMLElement;

        const inputs = el.querySelectorAll('input.form-control');
        expect(inputs.length).toBeGreaterThan(0);

        inputs.forEach((input) => {
          expect(
            input.classList.contains('form-control-sm'),
            `Input "${input.getAttribute('id')}" in '${viewMode}' mode is missing form-control-sm class. ` +
            `Has classes: ${input.className}`,
          ).toBe(true);
        });
      }),
      { numRuns: 4 },
    );
  });

  it('should have form-label-sm on all labels', () => {
    fc.assert(
      fc.property(formViewModeArb, (viewMode) => {
        const fixture = createFixture(viewMode);
        const el = fixture.nativeElement as HTMLElement;

        const labels = el.querySelectorAll('label.form-label');
        expect(labels.length).toBeGreaterThan(0);

        labels.forEach((label) => {
          expect(
            label.classList.contains('form-label-sm'),
            `Label "${label.textContent?.trim()}" in '${viewMode}' mode is missing form-label-sm class. ` +
            `Has classes: ${label.className}`,
          ).toBe(true);
        });
      }),
      { numRuns: 4 },
    );
  });

  it('should have form-select-sm on all select elements', () => {
    fc.assert(
      fc.property(formViewModeArb, (viewMode) => {
        const fixture = createFixture(viewMode);
        const el = fixture.nativeElement as HTMLElement;

        const selects = el.querySelectorAll('select.form-select');
        expect(selects.length).toBeGreaterThan(0);

        selects.forEach((select) => {
          expect(
            select.classList.contains('form-select-sm'),
            `Select "${select.getAttribute('id')}" in '${viewMode}' mode is missing form-select-sm class. ` +
            `Has classes: ${select.className}`,
          ).toBe(true);
        });
      }),
      { numRuns: 4 },
    );
  });

  it('should use row g-2 mb-3 layout (not tp-form-grid)', () => {
    fc.assert(
      fc.property(formViewModeArb, (viewMode) => {
        const fixture = createFixture(viewMode);
        const el = fixture.nativeElement as HTMLElement;

        const rowLayout = el.querySelector('.row.g-2.mb-3');
        expect(
          rowLayout,
          `Expected .row.g-2.mb-3 layout in '${viewMode}' mode, but found none. ` +
          `Current structure uses .tp-form-grid instead.`,
        ).not.toBeNull();

        const tpFormGrid = el.querySelector('.tp-form-grid');
        expect(
          tpFormGrid,
          `Found .tp-form-grid in '${viewMode}' mode — should have been replaced with .row.g-2.mb-3`,
        ).toBeNull();
      }),
      { numRuns: 4 },
    );
  });

  it('should have h6 section heading with correct classes', () => {
    fc.assert(
      fc.property(formViewModeArb, (viewMode) => {
        const fixture = createFixture(viewMode);
        const el = fixture.nativeElement as HTMLElement;

        const heading = el.querySelector('h6.text-muted.text-uppercase.fw-semibold');
        expect(
          heading,
          `Expected h6.text-muted.text-uppercase.fw-semibold section heading in '${viewMode}' mode, but found none.`,
        ).not.toBeNull();
      }),
      { numRuns: 4 },
    );
  });

  it('should have btn-sm on action buttons', () => {
    fc.assert(
      fc.property(formViewModeArb, (viewMode) => {
        const fixture = createFixture(viewMode);
        const el = fixture.nativeElement as HTMLElement;

        // Find buttons inside the form (Save and Cancel)
        const form = el.querySelector('form');
        expect(form, `No <form> element found in '${viewMode}' mode`).not.toBeNull();

        const buttons = form!.querySelectorAll('button.btn');
        expect(buttons.length).toBeGreaterThan(0);

        buttons.forEach((btn) => {
          expect(
            btn.classList.contains('btn-sm'),
            `Button "${btn.textContent?.trim()}" in '${viewMode}' mode is missing btn-sm class. ` +
            `Has classes: ${btn.className}`,
          ).toBe(true);
        });
      }),
      { numRuns: 4 },
    );
  });
});
