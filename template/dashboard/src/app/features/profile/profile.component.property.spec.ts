import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
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

describe('ProfileComponent behavior', () => {
  let profileServiceMock: {
    getProfile: ReturnType<typeof vi.fn>;
    updateProfile: ReturnType<typeof vi.fn>;
  };
  let notificationServiceMock: {
    showProgress: ReturnType<typeof vi.fn>;
    showError: ReturnType<typeof vi.fn>;
    updateToSuccess: ReturnType<typeof vi.fn>;
    updateToError: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    profileServiceMock = {
      getProfile: vi.fn().mockReturnValue(of({
        username: 'user001',
        nombre: 'Ada',
        apellidos: 'Lovelace',
        email: 'ada@example.com',
        lastAccess: '2024-01-15T10:30:00',
      })),
      updateProfile: vi.fn().mockReturnValue(of({
        username: 'user001',
        nombre: 'Grace',
        apellidos: 'Hopper',
        email: 'grace@example.com',
        lastAccess: '2024-01-15T10:30:00',
      })),
    };

    notificationServiceMock = {
      showProgress: vi.fn().mockReturnValue('progress-id'),
      showError: vi.fn(),
      updateToSuccess: vi.fn(),
      updateToError: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        { provide: ProfileService, useValue: profileServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
      ],
    }).compileComponents();
  });

  it('should validate the form and avoid saving when invalid', () => {
    const fixture = TestBed.createComponent(ProfileComponent);
    const component = fixture.componentInstance;

    component.ngOnInit();
    component.profileForm.reset();
    component.save();

    expect(notificationServiceMock.showProgress).not.toHaveBeenCalled();
    expect(component.profileForm.touched).toBe(true);
    expect(component.saving()).toBe(false);
  });

  it('should save a valid profile and notify success', () => {
    const fixture = TestBed.createComponent(ProfileComponent);
    const component = fixture.componentInstance;

    component.ngOnInit();
    component.profileForm.patchValue({
      nombre: 'Grace',
      apellidos: 'Hopper',
      email: 'grace@example.com',
    });

    component.save();

    expect(profileServiceMock.updateProfile).toHaveBeenCalledWith({
      nombre: 'Grace',
      apellidos: 'Hopper',
      email: 'grace@example.com',
    });
    expect(notificationServiceMock.showProgress).toHaveBeenCalledWith('notification.update.progress');
    expect(notificationServiceMock.updateToSuccess).toHaveBeenCalledWith('progress-id', 'notification.update.success');
    expect(component.username()).toBe('user001');
    expect(component.saving()).toBe(false);
  });

  it('should show an error notification when profile loading fails', () => {
    profileServiceMock.getProfile.mockReturnValueOnce(throwError(() => new Error('boom')));
    const fixture = TestBed.createComponent(ProfileComponent);
    const component = fixture.componentInstance;

    component.ngOnInit();

    expect(notificationServiceMock.showError).toHaveBeenCalledWith('profile.load.error');
  });

  it('should expose validation errors only after the control has been touched', () => {
    const fixture = TestBed.createComponent(ProfileComponent);
    const component = fixture.componentInstance;

    component.ngOnInit();
    const control = component.profileForm.get('email');

    control?.setValue('bad-email');
    control?.markAsTouched();

    expect(component.hasError('email', 'email')).toBe(true);
    expect(component.hasError('nombre', 'required')).toBe(false);
  });
});
