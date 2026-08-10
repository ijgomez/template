import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import * as fc from 'fast-check';

import { ProfilesComponent } from './profiles.component';
import { ProfileService } from '../../../../core/services/profile.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CsvExportService } from '../../../../core/services/csv-export.service';

/**
 * Property-based test for bug condition exploration:
 * Form styling diverges from reference pattern in Profiles component.
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 1.12, 1.13, 1.14, 1.15**
 *
 * Property 1 (Bug Condition): For the Profiles component in 'form' mode,
 * the form SHALL render with: tp-filter-bar container wrapping the form,
 * and action buttons (Save/Cancel) positioned inside the form element (not in the page header).
 *
 * IMPORTANT: This test is expected to FAIL on unfixed code — failure confirms the bug exists.
 */
describe('ProfilesComponent - Property 1: Bug Condition - Form Styling Matches Reference Pattern', () => {
  /**
   * Arbitrary for form scenarios — profiles form mode is always 'form',
   * but the form can be in create or edit state.
   */
  const formEditingStateArb = fc.boolean();

  function createFixture(isEditing: boolean): ComponentFixture<ProfilesComponent> {
    const profileServiceMock: Partial<ProfileService> = {
      findByCriteria: () => of({ content: [], page: { totalElements: 0, totalPages: 0, size: 10, number: 0 } } as any),
      findAllActions: () => of({ content: [], page: { totalElements: 0, totalPages: 0, size: 1000, number: 0 } } as any),
    };

    const authServiceMock: Partial<AuthService> = {
      hasAction: () => true,
      getCurrentUser: () => ({
        username: 'testuser',
        profile: 'ADMIN',
        actions: ['PROFILE_READ', 'PROFILE_WRITE'],
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

    const csvExportServiceMock: Partial<CsvExportService> = {
      export: () => {},
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ProfilesComponent],
      providers: [
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        { provide: ProfileService, useValue: profileServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
        { provide: CsvExportService, useValue: csvExportServiceMock },
      ],
    });

    const fixture = TestBed.createComponent(ProfilesComponent);
    const component = fixture.componentInstance;

    // Set to form mode
    if (isEditing) {
      component.openEditForm({
        id: 1,
        name: 'Test Profile',
        description: 'Test description',
        actions: [{ id: 1, code: 'TEST_READ', type: 'READ', name: 'Test Read' }],
      });
    } else {
      component.openCreateForm();
    }

    fixture.detectChanges();
    return fixture;
  }

  it('should have tp-filter-bar container wrapping the form', () => {
    fc.assert(
      fc.property(formEditingStateArb, (isEditing) => {
        const fixture = createFixture(isEditing);
        const el = fixture.nativeElement as HTMLElement;
        const mode = isEditing ? 'edit' : 'create';

        const filterBar = el.querySelector('.tp-filter-bar');
        expect(
          filterBar,
          `Expected .tp-filter-bar container in '${mode}' form mode, but found none. ` +
          `Current structure has no container wrapping the form.`,
        ).not.toBeNull();
      }),
      { numRuns: 4 },
    );
  });

  it('should have action buttons inside the form element (not in page header)', () => {
    fc.assert(
      fc.property(formEditingStateArb, (isEditing) => {
        const fixture = createFixture(isEditing);
        const el = fixture.nativeElement as HTMLElement;
        const mode = isEditing ? 'edit' : 'create';

        const form = el.querySelector('form');
        expect(form, `No <form> element found in '${mode}' form mode`).not.toBeNull();

        // Save button should be INSIDE the form, not in the header
        const saveBtn = form!.querySelector('[data-testid="btn-save"]');
        expect(
          saveBtn,
          `Save button should be inside the <form> element in '${mode}' mode, ` +
          `but it's in the page header instead.`,
        ).not.toBeNull();

        // Cancel button should be INSIDE the form, not in the header
        const cancelBtn = form!.querySelector('[data-testid="btn-cancel"]');
        expect(
          cancelBtn,
          `Cancel button should be inside the <form> element in '${mode}' mode, ` +
          `but it's in the page header instead.`,
        ).not.toBeNull();
      }),
      { numRuns: 4 },
    );
  });

  it('should not have action buttons in the page header when in form mode', () => {
    fc.assert(
      fc.property(formEditingStateArb, (isEditing) => {
        const fixture = createFixture(isEditing);
        const el = fixture.nativeElement as HTMLElement;
        const mode = isEditing ? 'edit' : 'create';

        // The header is the first d-flex div with the title
        const headerDiv = el.querySelector('.d-flex.justify-content-between.align-items-center.mb-3');
        if (headerDiv) {
          // In correct implementation, header should have NO save/cancel buttons
          const headerSaveBtn = headerDiv.querySelector('[data-testid="btn-save"]');
          const headerCancelBtn = headerDiv.querySelector('[data-testid="btn-cancel"]');

          expect(
            headerSaveBtn,
            `Save button found in page header in '${mode}' mode — should be inside the form.`,
          ).toBeNull();
          expect(
            headerCancelBtn,
            `Cancel button found in page header in '${mode}' mode — should be inside the form.`,
          ).toBeNull();
        }
      }),
      { numRuns: 4 },
    );
  });
});
