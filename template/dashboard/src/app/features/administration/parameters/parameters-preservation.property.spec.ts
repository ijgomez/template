import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import * as fc from 'fast-check';

import { ParametersComponent } from './parameters.component';
import { ParameterService } from '../../../core/services/parameter.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

/**
 * Property-based preservation tests:
 * Verify that the Parameters list and detail views retain their correct DOM structure
 * after the upcoming form-only fix is applied.
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**
 *
 * Property 2 (Preservation): For any non-form view (list, detail) in the Parameters component,
 * the rendered DOM SHALL remain identical to its pre-fix structure:
 *   - List view: .tp-filter-bar (filter), .tp-toolbar, tp-data-table
 *   - Detail view: .card > .card-body > .tp-form-grid
 *
 * IMPORTANT: These tests MUST PASS on unfixed code — they confirm the baseline to preserve.
 */
describe('ParametersComponent - Property 2: Preservation - List and Detail Views Unchanged', () => {
  let parameterServiceMock: Partial<ParameterService>;
  let authServiceMock: Partial<AuthService>;
  let notificationServiceMock: Partial<NotificationService>;

  beforeEach(() => {
    parameterServiceMock = {
      findByCriteria: () =>
        of({
          content: [
            { id: 1, code: 'PARAM_1', description: 'First', value: 'val1', type: 'STRING', createdAt: '2024-01-01', lastModifiedAt: '2024-01-02' },
          ],
          page: { totalElements: 1, totalPages: 1, size: 10, number: 0 },
        } as any),
    };

    authServiceMock = {
      hasAction: () => true,
      getCurrentUser: () => ({
        username: 'testuser',
        profile: 'ADMIN',
        actions: ['SYSTEM_PARAMETER_READ', 'SYSTEM_PARAMETER_WRITE'],
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      }),
    };

    notificationServiceMock = {
      showSuccess: () => '',
      showProgress: () => '',
      updateToSuccess: () => {},
      updateToError: () => {},
      showError: () => '',
    };
  });

  function createFixture(): ComponentFixture<ParametersComponent> {
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
    fixture.detectChanges();
    return fixture;
  }

  // ─── LIST VIEW PRESERVATION ─────────────────────────────────────────────────

  describe('List view preservation', () => {
    it('should render .tp-filter-bar container in list view for all parameter data sets', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 1000 }),
              code: fc.string({ minLength: 1, maxLength: 20 }),
              description: fc.string({ maxLength: 50 }),
              value: fc.string({ maxLength: 100 }),
              type: fc.constantFrom('STRING', 'INTEGER', 'BOOLEAN', 'DATE'),
              createdAt: fc.constant('2024-01-01'),
              lastModifiedAt: fc.constant('2024-01-02'),
            }),
            { minLength: 0, maxLength: 5 },
          ),
          (parameters) => {
            parameterServiceMock.findByCriteria = () =>
              of({
                content: parameters,
                page: { totalElements: parameters.length, totalPages: 1, size: 10, number: 0 },
              } as any);

            const fixture = createFixture();
            const el = fixture.nativeElement as HTMLElement;

            // List view is the default mode — verify filter bar is present
            const filterBar = el.querySelector('.tp-filter-bar');
            expect(filterBar).not.toBeNull();
          },
        ),
        { numRuns: 10 },
      );
    });

    it('should render .tp-toolbar in list view', () => {
      const fixture = createFixture();
      const el = fixture.nativeElement as HTMLElement;

      const toolbar = el.querySelector('.tp-toolbar');
      expect(toolbar).not.toBeNull();
      expect(toolbar!.classList.contains('d-flex')).toBe(true);
      expect(toolbar!.classList.contains('gap-2')).toBe(true);
      expect(toolbar!.classList.contains('mb-3')).toBe(true);
    });

    it('should render tp-data-table element in list view', () => {
      const fixture = createFixture();
      const el = fixture.nativeElement as HTMLElement;

      const table = el.querySelector('tp-data-table');
      expect(table).not.toBeNull();
    });

    it('should have filter form inside tp-filter-bar with correct structure', () => {
      const fixture = createFixture();
      const el = fixture.nativeElement as HTMLElement;

      const filterBar = el.querySelector('.tp-filter-bar');
      expect(filterBar).not.toBeNull();

      const form = filterBar!.querySelector('form');
      expect(form).not.toBeNull();
      expect(form!.classList.contains('row')).toBe(true);
      expect(form!.classList.contains('g-3')).toBe(true);
      expect(form!.classList.contains('align-items-end')).toBe(true);
    });

    it('should have filter inputs with form-control-sm in list view', () => {
      const fixture = createFixture();
      const el = fixture.nativeElement as HTMLElement;

      const filterBar = el.querySelector('.tp-filter-bar');
      const inputs = filterBar!.querySelectorAll('input.form-control-sm');
      expect(inputs.length).toBeGreaterThan(0);

      const selects = filterBar!.querySelectorAll('select.form-select-sm');
      expect(selects.length).toBeGreaterThan(0);
    });

    it('should have btn-sm on all toolbar buttons in list view', () => {
      const fixture = createFixture();
      const el = fixture.nativeElement as HTMLElement;

      const toolbar = el.querySelector('.tp-toolbar');
      const buttons = toolbar!.querySelectorAll('button.btn');
      expect(buttons.length).toBeGreaterThan(0);

      buttons.forEach((btn) => {
        expect(btn.classList.contains('btn-sm')).toBe(true);
      });
    });
  });

  // ─── DETAIL VIEW PRESERVATION ───────────────────────────────────────────────

  describe('Detail view preservation', () => {
    it('should render .card > .card-body > .tp-form-grid in detail view for any parameter', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.integer({ min: 1, max: 1000 }),
            code: fc.string({ minLength: 1, maxLength: 20 }),
            description: fc.string({ maxLength: 50 }),
            value: fc.string({ maxLength: 100 }),
            type: fc.constantFrom('STRING', 'INTEGER', 'BOOLEAN', 'DATE'),
            createdAt: fc.constant('2024-01-01'),
            lastModifiedAt: fc.constant('2024-01-02'),
          }),
          (param) => {
            const fixture = createFixture();
            const component = fixture.componentInstance;

            // Navigate to detail view
            component.viewDetail(param as any);
            fixture.detectChanges();

            const el = fixture.nativeElement as HTMLElement;

            // Verify card structure is preserved in detail view
            const card = el.querySelector('.card');
            expect(card).not.toBeNull();

            const cardBody = card!.querySelector('.card-body');
            expect(cardBody).not.toBeNull();

            const formGrid = cardBody!.querySelector('.tp-form-grid');
            expect(formGrid).not.toBeNull();
          },
        ),
        { numRuns: 10 },
      );
    });

    it('should have form-group elements inside tp-form-grid in detail view', () => {
      const fixture = createFixture();
      const component = fixture.componentInstance;

      component.viewDetail({
        id: 1,
        code: 'TEST',
        description: 'Test desc',
        value: 'test-val',
        type: 'STRING',
        createdAt: '2024-01-01',
        lastModifiedAt: '2024-01-02',
      });
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const formGrid = el.querySelector('.tp-form-grid');
      const formGroups = formGrid!.querySelectorAll('.form-group');
      expect(formGroups.length).toBeGreaterThan(0);
    });

    it('should have form-field-full class on description field in detail view', () => {
      const fixture = createFixture();
      const component = fixture.componentInstance;

      component.viewDetail({
        id: 1,
        code: 'TEST',
        description: 'Full width field',
        value: 'val',
        type: 'STRING',
        createdAt: '2024-01-01',
        lastModifiedAt: '2024-01-02',
      });
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const fullWidthField = el.querySelector('.form-group.form-field-full');
      expect(fullWidthField).not.toBeNull();
    });

    it('should have header with back, edit and delete buttons in detail view', () => {
      const fixture = createFixture();
      const component = fixture.componentInstance;

      component.viewDetail({
        id: 1,
        code: 'TEST',
        description: 'Test',
        value: 'val',
        type: 'STRING',
        createdAt: '2024-01-01',
        lastModifiedAt: '2024-01-02',
      });
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const backBtn = el.querySelector('[data-testid="btn-back"]');
      const editBtn = el.querySelector('[data-testid="btn-edit-detail"]');
      const deleteBtn = el.querySelector('[data-testid="btn-delete-detail"]');

      expect(backBtn).not.toBeNull();
      expect(editBtn).not.toBeNull();
      expect(deleteBtn).not.toBeNull();
    });
  });
});
