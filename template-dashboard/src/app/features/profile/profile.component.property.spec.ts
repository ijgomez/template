import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import * as fc from 'fast-check';

import { ProfileComponent } from './profile.component';
import { ProfileService } from './services/profile.service';
import { NotificationService } from '../../core/services/notification.service';

/**
 * Property-based test for bug condition exploration:
 * Form styling diverges from reference pattern in Profile (personal) component.
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 1.12, 1.13, 1.14, 1.15**
 *
 * Property 1 (Bug Condition): For the Profile personal component (after loading),
 * the form SHALL render with: tp-filter-bar container, form-control-sm inputs,
 * form-label-sm labels, row g-2 mb-3 layout, h6 section heading, and btn-sm on buttons.
 *
 * IMPORTANT: This test is expected to FAIL on unfixed code — failure confirms the bug exists.
 */
describe('ProfileComponent - Property 1: Bug Condition - Form Styling Matches Reference Pattern', () => {
  /**
   * Arbitrary for profile data — generates different valid user profile data.
   */
  const profileDataArb = fc.record({
    username: fc.string({ minLength: 3, maxLength: 20 }).map((s) => s.replace(/[^a-zA-Z0-9]/g, 'a') || 'user'),
    nombre: fc.string({ minLength: 1, maxLength: 50 }).map((s) => s.replace(/[^a-zA-Z]/g, 'A') || 'Nombre'),
    apellidos: fc.string({ minLength: 1, maxLength: 100 }).map((s) => s.replace(/[^a-zA-Z]/g, 'B') || 'Apellidos'),
    email: fc.emailAddress(),
    lastAccess: fc.constantFrom('2024-01-15T10:30:00', '2024-06-20T14:45:00', null),
  });

  function createFixture(profileData: {
    username: string;
    nombre: string;
    apellidos: string;
    email: string;
    lastAccess: string | null;
  }): ComponentFixture<ProfileComponent> {
    const profileServiceMock: Partial<ProfileService> = {
      getProfile: () => of(profileData),
      updateProfile: () => of(profileData),
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
      imports: [ProfileComponent],
      providers: [
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        { provide: ProfileService, useValue: profileServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
      ],
    });

    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges(); // triggers ngOnInit and loads profile
    return fixture;
  }

  it('should have tp-filter-bar container (not card > card-body)', () => {
    fc.assert(
      fc.property(profileDataArb, (profileData) => {
        const fixture = createFixture(profileData);
        const el = fixture.nativeElement as HTMLElement;

        const filterBar = el.querySelector('.tp-filter-bar');
        expect(
          filterBar,
          `Expected .tp-filter-bar container in Profile form, but found none. ` +
          `Current structure uses .card > .card-body instead.`,
        ).not.toBeNull();
      }),
      { numRuns: 5 },
    );
  });

  it('should have form-control-sm on all text inputs', () => {
    fc.assert(
      fc.property(profileDataArb, (profileData) => {
        const fixture = createFixture(profileData);
        const el = fixture.nativeElement as HTMLElement;

        const inputs = el.querySelectorAll('input.form-control');
        expect(inputs.length).toBeGreaterThan(0);

        inputs.forEach((input) => {
          expect(
            input.classList.contains('form-control-sm'),
            `Input "${input.getAttribute('id')}" is missing form-control-sm class. ` +
            `Has classes: ${input.className}`,
          ).toBe(true);
        });
      }),
      { numRuns: 5 },
    );
  });

  it('should have form-label-sm on all labels', () => {
    fc.assert(
      fc.property(profileDataArb, (profileData) => {
        const fixture = createFixture(profileData);
        const el = fixture.nativeElement as HTMLElement;

        const labels = el.querySelectorAll('label.form-label');
        expect(labels.length).toBeGreaterThan(0);

        labels.forEach((label) => {
          expect(
            label.classList.contains('form-label-sm'),
            `Label "${label.textContent?.trim()}" is missing form-label-sm class. ` +
            `Has classes: ${label.className}`,
          ).toBe(true);
        });
      }),
      { numRuns: 5 },
    );
  });

  it('should use row g-2 mb-3 layout (not tp-form-grid)', () => {
    fc.assert(
      fc.property(profileDataArb, (profileData) => {
        const fixture = createFixture(profileData);
        const el = fixture.nativeElement as HTMLElement;

        const rowLayout = el.querySelector('.row.g-2.mb-3');
        expect(
          rowLayout,
          `Expected .row.g-2.mb-3 layout in Profile form, but found none. ` +
          `Current structure uses .tp-form-grid instead.`,
        ).not.toBeNull();

        const tpFormGrid = el.querySelector('.tp-form-grid');
        expect(
          tpFormGrid,
          `Found .tp-form-grid in Profile form — should have been replaced with .row.g-2.mb-3`,
        ).toBeNull();
      }),
      { numRuns: 5 },
    );
  });

  it('should have h6 section heading with correct classes', () => {
    fc.assert(
      fc.property(profileDataArb, (profileData) => {
        const fixture = createFixture(profileData);
        const el = fixture.nativeElement as HTMLElement;

        const heading = el.querySelector('h6.text-muted.text-uppercase.fw-semibold');
        expect(
          heading,
          `Expected h6.text-muted.text-uppercase.fw-semibold section heading in Profile form, but found none.`,
        ).not.toBeNull();
      }),
      { numRuns: 5 },
    );
  });

  it('should have btn-sm on the save button', () => {
    fc.assert(
      fc.property(profileDataArb, (profileData) => {
        const fixture = createFixture(profileData);
        const el = fixture.nativeElement as HTMLElement;

        const saveBtn = el.querySelector('[data-testid="btn-save"]');
        expect(saveBtn, `No save button found in Profile form`).not.toBeNull();

        expect(
          saveBtn!.classList.contains('btn-sm'),
          `Save button is missing btn-sm class. Has classes: ${saveBtn!.className}`,
        ).toBe(true);
      }),
      { numRuns: 5 },
    );
  });
});
