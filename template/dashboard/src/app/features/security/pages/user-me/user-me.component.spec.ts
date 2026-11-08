import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideTranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Observable, Subject, of, throwError } from 'rxjs';

import { UserMeComponent } from './user-me.component';
import { UserFormComponent } from '../user-form/user-form.component';
import { UserMeService } from '../../services/user-me.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ReportService } from '../../../../core/services/report.service';
import { UserDTO } from '../../../../core/models/user.model';

/**
 * Unit tests for UserMeComponent covering the loading state, the save flow
 * (success and error), navigation and the mapping of the profile to the form.
 * Complements the property spec, which covers the view/edit rendering.
 */
describe('UserMeComponent', () => {
  let fixture: ComponentFixture<UserMeComponent>;
  let component: UserMeComponent;

  const profile = {
    username: 'user001',
    nombre: 'Ada',
    apellidos: 'Lovelace',
    email: 'ada@example.com',
    lastAccess: '2024-01-15T10:30:00',
  };

  const userMeService = {
    getProfile: (): Observable<unknown> => of(profile),
    updateProfile: (..._a: unknown[]): Observable<unknown> =>
      of({ ...profile, nombre: 'Grace', apellidos: 'Hopper', email: 'grace@example.com' }),
  };
  const notificationService = {
    showProgress: (..._a: unknown[]) => 'ntf-1',
    updateToSuccess: (..._a: unknown[]) => undefined,
    updateToError: (..._a: unknown[]) => undefined,
    showError: (..._a: unknown[]) => undefined,
  };
  const authService = { getCurrentUser: (): { profile: string } | null => ({ profile: 'ADMIN' }) };
  const reportService = {
    findUserReports: (): Observable<unknown> => of([{ id: 101 }, { id: 102 }]),
    findAll: (): Observable<unknown> => of([]),
  };
  const router = { navigate: (..._a: unknown[]) => Promise.resolve(true) };

  const el = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const form = (): UserFormComponent | null =>
    (fixture.debugElement.query(By.directive(UserFormComponent))?.componentInstance as UserFormComponent) ?? null;

  const create = (): void => {
    fixture = TestBed.createComponent(UserMeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserMeComponent],
      providers: [
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        { provide: UserMeService, useValue: userMeService },
        { provide: NotificationService, useValue: notificationService },
        { provide: AuthService, useValue: authService },
        { provide: ReportService, useValue: reportService },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loading', () => {
    it('should show the spinner while the profile is loading and hide the form', () => {
      const pending = new Subject<unknown>();
      vi.spyOn(userMeService, 'getProfile').mockReturnValue(pending);

      create();

      expect(component.loading()).toBe(true);
      expect(el().querySelector('[data-testid="profile-loading"]')).toBeTruthy();
      expect(form()).toBeNull();
    });

    it('should show the form once the profile has loaded', () => {
      create();

      expect(component.loading()).toBe(false);
      expect(el().querySelector('[data-testid="profile-loading"]')).toBeNull();
      expect(form()).toBeTruthy();
    });

    it('should stop loading and notify an error when the reports fail', () => {
      vi.spyOn(reportService, 'findUserReports').mockReturnValue(throwError(() => new Error('boom')));
      const showError = vi.spyOn(notificationService, 'showError');

      create();

      expect(component.loading()).toBe(false);
      expect(showError).toHaveBeenCalledWith('profile.load.error');
    });

    it('should map missing profile fields to null and use no profile name without a session', () => {
      vi.spyOn(userMeService, 'getProfile').mockReturnValue(
        of({ username: 'user001', nombre: null, apellidos: null, email: null, lastAccess: null }),
      );
      vi.spyOn(authService, 'getCurrentUser').mockReturnValue(null);

      create();

      expect(component.profileUser().firstName).toBeNull();
      expect(component.profileUser().lastName).toBeNull();
      expect(component.profileUser().email).toBeNull();
      expect(component.profileUser().profileName).toBeUndefined();
    });
  });

  describe('navigation', () => {
    beforeEach(() => {
      create();
    });

    it('onBack should navigate to the dashboard', () => {
      const navigate = vi.spyOn(router, 'navigate');

      component.onBack();

      expect(navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('onEdit should switch to edit mode and onCancel should return to view mode', () => {
      component.onEdit();
      expect(component.mode()).toBe('edit');

      component.onCancel();
      expect(component.mode()).toBe('view');
    });
  });

  describe('onSave', () => {
    const edited = { firstName: 'Grace', lastName: 'Hopper', email: 'grace@example.com' } as UserDTO;

    beforeEach(() => {
      create();
      component.onEdit();
    });

    it('should send the editable fields to the backend', () => {
      const update = vi.spyOn(userMeService, 'updateProfile');

      component.onSave(edited);

      expect(update).toHaveBeenCalledWith({ nombre: 'Grace', apellidos: 'Hopper', email: 'grace@example.com' });
    });

    it('should default null fields to empty strings in the payload', () => {
      const update = vi.spyOn(userMeService, 'updateProfile');

      component.onSave({ firstName: null, lastName: null, email: null } as UserDTO);

      expect(update).toHaveBeenCalledWith({ nombre: '', apellidos: '', email: '' });
    });

    it('should patch the profile, return to view mode and notify success', () => {
      const success = vi.spyOn(notificationService, 'updateToSuccess');

      component.onSave(edited);

      expect(component.profileUser().firstName).toBe('Grace');
      expect(component.profileUser().email).toBe('grace@example.com');
      expect(component.saving()).toBe(false);
      expect(component.mode()).toBe('view');
      expect(success).toHaveBeenCalledWith('ntf-1', 'notification.update.success');
    });

    it('should notify an error and stay in edit mode when the update fails', () => {
      vi.spyOn(userMeService, 'updateProfile').mockReturnValue(throwError(() => new Error('boom')));
      const updateToError = vi.spyOn(notificationService, 'updateToError');

      component.onSave(edited);

      expect(component.saving()).toBe(false);
      expect(component.mode()).toBe('edit');
      expect(updateToError).toHaveBeenCalledWith('ntf-1', 'notification.update.error');
    });
  });

  describe('form events', () => {
    beforeEach(() => {
      create();
    });

    it('should switch to edit mode when the form emits edit', () => {
      form()!.edit.emit(component.profileUser());
      fixture.detectChanges();

      expect(component.mode()).toBe('edit');
      expect(form()!.mode()).toBe('edit');
    });

    it('should go back to the dashboard when the form emits cancelled in view mode', () => {
      const navigate = vi.spyOn(router, 'navigate');

      form()!.cancelled.emit();

      expect(navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });
});
