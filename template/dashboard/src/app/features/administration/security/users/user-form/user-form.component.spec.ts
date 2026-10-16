import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NgForm } from '@angular/forms';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { UserFormComponent } from './user-form.component';
import { UserDTO } from '../../../../../core/models/user.model';
import { ReportService } from '../../../../../core/services/report.service';
import { UserService } from '../../../../../core/services/user.service';

/** Builds a UserDTO with sensible defaults. */
function buildUser(overrides: Partial<UserDTO> = {}): UserDTO {
  return {
    id: 1,
    username: 'jdoe',
    password: '',
    firstName: 'John',
    lastName: 'Doe',
    email: 'jdoe@example.com',
    profileId: 10,
    reportIds: [1, 2],
    lastAccess: null,
    createdAt: null,
    lastModifiedAt: null,
    ...overrides,
  };
}

describe('UserFormComponent', () => {
  let component: UserFormComponent;
  let fixture: ComponentFixture<UserFormComponent>;

  /** Configures the fixture with the given required inputs. */
  function setup(mode: 'create' | 'edit' | 'view', user: UserDTO = buildUser(), canWrite = false) {
    fixture = TestBed.createComponent(UserFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('mode', mode);
    fixture.componentRef.setInput('user', user);
    fixture.componentRef.setInput('canWrite', canWrite);
    fixture.detectChanges(); // ngOnInit -> copies user into formUser
  }

  beforeEach(async () => {
    const reportService = {
      findAll: vi.fn().mockReturnValue(of([])),
      search: vi.fn().mockReturnValue(of({ content: [], page: { size: 5, number: 0, totalElements: 0, totalPages: 1 } })),
    };

    const userService = {
      getProfiles: vi.fn().mockReturnValue(of([
        { id: 10, name: 'Admin' },
        { id: 20, name: 'User' },
      ])),
    };

    await TestBed.configureTestingModule({
      imports: [UserFormComponent],
      providers: [
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        { provide: ReportService, useValue: reportService },
        { provide: UserService, useValue: userService },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    setup('create');
    expect(component).toBeTruthy();
  });

  it('should copy the input user into the internal form state', () => {
    const user = buildUser({ username: 'alice', email: 'alice@example.com' });
    setup('edit', user);
    expect(component.formUser().username).toBe('alice');
    expect(component.formUser().email).toBe('alice@example.com');
    // Must be a copy, not the same reference
    expect(component.formUser()).not.toBe(user);
  });

  it('should sync the selected profile when the input user changes', () => {
    setup('edit', buildUser({ profileId: 10 }));
    fixture.componentRef.setInput('user', buildUser({ profileId: 20 }));
    fixture.detectChanges();

    expect(component.formUser().profileId).toBe(20);
  });

  describe('isReadonly', () => {
    it('should be true only in view mode', () => {
      setup('view');
      expect(component.isReadonly()).toBe(true);
    });

    it('should be false in create mode', () => {
      setup('create');
      expect(component.isReadonly()).toBe(false);
    });

    it('should be false in edit mode', () => {
      setup('edit');
      expect(component.isReadonly()).toBe(false);
    });
  });

  describe('updateField', () => {
    it('should update a field when not readonly', () => {
      setup('edit');
      component.updateField('firstName', 'Jane');
      expect(component.formUser().firstName).toBe('Jane');
    });

    it('should update the profileId field', () => {
      setup('create', buildUser({ profileId: null }));
      component.updateField('profileId', 20);
      expect(component.formUser().profileId).toBe(20);
    });

    it('should NOT update any field in view mode', () => {
      setup('view');
      const before = component.formUser().firstName;
      component.updateField('firstName', 'Changed');
      expect(component.formUser().firstName).toBe(before);
    });
  });

  describe('onSubmit', () => {
    it('should emit save with the current form value when not readonly', () => {
      setup('edit');
      const spy = vi.fn();
      component.save.subscribe(spy);
      component.updateField('firstName', 'Updated');
      component.onSubmit();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].firstName).toBe('Updated');
    });

    it('should disable save when required fields are empty in create mode', () => {
      setup('create', buildUser({ username: '', password: '', profileId: null }));
      const button = fixture.nativeElement.querySelector('[data-testid="btn-save"]') as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });

    it('should mark the email field invalid when the value is malformed', () => {
      setup('create', buildUser({ email: 'invalid-email' }));
      expect(component.emailIsInvalid()).toBe(true);
    });

    it('should NOT emit save in view mode', () => {
      setup('view');
      const spy = vi.fn();
      component.save.subscribe(spy);
      component.onSubmit();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('inline validation errors (accessibility)', () => {
    /**
     * Marks the named control as touched + dirty through Angular's forms API
     * (robust against one-way [ngModel] + signal rebinding) and refreshes the view.
     * ngModel controls register asynchronously, so we await stabilization first.
     */
    async function touchControl(name: string) {
      await fixture.whenStable();
      fixture.detectChanges();
      const form = fixture.debugElement.query(By.directive(NgForm)).injector.get(NgForm);
      const control = form.controls[name];
      control.markAsTouched();
      control.markAsDirty();
      control.updateValueAndValidity();
      fixture.detectChanges();
    }

    it('should show an inline error for a required empty username, linked via aria-describedby', async () => {
      setup('create', buildUser({ username: '' }));
      await touchControl('username');

      const input = fixture.nativeElement.querySelector('[data-testid="input-username"]') as HTMLInputElement;
      const error = fixture.nativeElement.querySelector('[data-testid="error-username"]') as HTMLElement;
      expect(error).toBeTruthy();
      expect(error.id).toBe('username-error');
      expect(input.getAttribute('aria-describedby')).toBe('username-error');
      expect(input.getAttribute('aria-invalid')).toBe('true');
    });

    it('should show an inline error for a required empty password in create mode', async () => {
      setup('create', buildUser({ password: '' }));
      await touchControl('password');

      const input = fixture.nativeElement.querySelector('[data-testid="input-password"]') as HTMLInputElement;
      const error = fixture.nativeElement.querySelector('[data-testid="error-password"]') as HTMLElement;
      expect(error).toBeTruthy();
      expect(input.getAttribute('aria-describedby')).toBe('password-error');
    });

    it('should show an inline error for a malformed email', async () => {
      setup('create', buildUser({ email: 'invalid-email' }));
      await touchControl('email');

      const input = fixture.nativeElement.querySelector('[data-testid="input-email"]') as HTMLInputElement;
      const error = fixture.nativeElement.querySelector('[data-testid="error-email"]') as HTMLElement;
      expect(error).toBeTruthy();
      expect(input.getAttribute('aria-describedby')).toBe('email-error');
    });

    it('should NOT render an error nor aria-describedby when the field is valid', () => {
      setup('edit', buildUser({ username: 'valid-user' }));
      const input = fixture.nativeElement.querySelector('[data-testid="input-username"]') as HTMLInputElement;

      expect(fixture.nativeElement.querySelector('[data-testid="error-username"]')).toBeNull();
      expect(input.getAttribute('aria-describedby')).toBeNull();
    });
  });

  describe('error summary (accessibility)', () => {
    it('should not render the summary before a submit is attempted', () => {
      setup('create', buildUser({ username: '', password: '', profileId: null }));
      expect(fixture.nativeElement.querySelector('[data-testid="error-summary"]')).toBeNull();
    });

    it('should list all validation errors and move focus to the summary after a failed submit', async () => {
      setup('create', buildUser({ username: '', password: '', email: 'bad', profileId: null }));

      component.onSubmit();
      await fixture.whenStable();
      fixture.detectChanges();

      const summary = fixture.nativeElement.querySelector('[data-testid="error-summary"]') as HTMLElement;
      expect(summary).toBeTruthy();
      expect(summary.getAttribute('role')).toBe('alert');
      expect(summary.getAttribute('tabindex')).toBe('-1');

      // One link per invalid field, each anchored to the field id.
      const links = summary.querySelectorAll('a.alert-link');
      expect(links.length).toBe(4);
      const hrefs = Array.from(links).map((a) => a.getAttribute('href'));
      expect(hrefs).toContain('#username');
      expect(hrefs).toContain('#password');
      expect(hrefs).toContain('#email');
      expect(hrefs).toContain('#profileId');

      // Focus moved to the summary.
      expect(fixture.nativeElement.querySelector('[data-testid="error-summary"]')).toBe(document.activeElement);
    });

    it('should NOT render the summary when the submit is valid', () => {
      setup('create', buildUser({ username: 'jdoe', password: 'secret', email: 'jdoe@example.com', profileId: 10 }));
      const spy = vi.fn();
      component.save.subscribe(spy);

      component.onSubmit();
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(fixture.nativeElement.querySelector('[data-testid="error-summary"]')).toBeNull();
    });

    it('should expose the computed formErrors for an invalid create form', () => {
      setup('create', buildUser({ username: '', password: '', email: 'bad', profileId: null }));
      const fieldIds = component.formErrors().map((e) => e.fieldId);
      expect(fieldIds).toEqual(['username', 'password', 'email', 'profileId']);
    });
  });

  describe('output events', () => {
    it('onCancel should emit cancel', () => {
      setup('edit');
      const spy = vi.fn();
      component.cancel.subscribe(spy);
      component.onCancel();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('onEdit should emit edit with the original input user', () => {
      const user = buildUser();
      setup('view', user);
      const spy = vi.fn();
      component.edit.subscribe(spy);
      component.onEdit();
      expect(spy).toHaveBeenCalledWith(user);
    });

    it('onDelete should emit delete with the original input user', () => {
      const user = buildUser();
      setup('view', user);
      const spy = vi.fn();
      component.delete.subscribe(spy);
      component.onDelete();
      expect(spy).toHaveBeenCalledWith(user);
    });
  });
});
