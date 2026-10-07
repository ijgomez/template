import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideTranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ProfileComponent } from './profile.component';
import { UserFormComponent } from '../administration/security/users/user-form/user-form.component';
import { ProfileService } from './services/profile.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ReportService } from '../../core/services/report.service';

describe('ProfileComponent behavior', () => {
  let profileServiceMock: {
    getProfile: ReturnType<typeof vi.fn>;
    updateProfile: ReturnType<typeof vi.fn>;
  };
  let notificationServiceMock: {
    showError: ReturnType<typeof vi.fn>;
  };
  let authServiceMock: {
    getCurrentUser: ReturnType<typeof vi.fn>;
  };
  let reportServiceMock: {
    findUserReports: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
  };
  let routerMock: {
    navigate: ReturnType<typeof vi.fn>;
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
      showError: vi.fn(),
    };

    authServiceMock = {
      getCurrentUser: vi.fn().mockReturnValue({
        username: 'user001',
        profile: 'ADMIN',
        actions: [],
        exp: 0,
        iat: 0,
      }),
    };

    reportServiceMock = {
      findUserReports: vi.fn().mockReturnValue(of([
        { id: 101, name: 'Informe A', description: 'A' },
        { id: 102, name: 'Informe B', description: 'B' },
      ])),
      findAll: vi.fn().mockReturnValue(of([
        { id: 101, name: 'Informe A', description: 'A' },
        { id: 102, name: 'Informe B', description: 'B' },
      ])),
    };

    routerMock = {
      navigate: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        { provide: ProfileService, useValue: profileServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: ReportService, useValue: reportServiceMock },
          { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();
  });

  it('should render user-form in view mode with mapped current user data', () => {
    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();

    const formDebugEl = fixture.debugElement.query(By.directive(UserFormComponent));
    expect(formDebugEl).not.toBeNull();

    const formComponent = formDebugEl.componentInstance as UserFormComponent;
    expect(formComponent.mode()).toBe('view');
    expect(formComponent.canWrite()).toBe(false);
    expect(formComponent.canEditView()).toBe(true);
    expect(formComponent.user().username).toBe('user001');
    expect(formComponent.user().firstName).toBe('Ada');
    expect(formComponent.user().lastName).toBe('Lovelace');
    expect(formComponent.user().email).toBe('ada@example.com');
    expect(formComponent.user().profileName).toBe('ADMIN');
    expect(formComponent.user().reportIds).toEqual([101, 102]);
  });

  it('should show an error notification when profile loading fails', () => {
    profileServiceMock.getProfile.mockReturnValueOnce(throwError(() => new Error('boom')));
    const fixture = TestBed.createComponent(ProfileComponent);
    const component = fixture.componentInstance;

    component.ngOnInit();

    expect(notificationServiceMock.showError).toHaveBeenCalledWith('profile.load.error');
  });

  it('should switch user-form to edit mode when edit action is triggered', () => {
    const fixture = TestBed.createComponent(ProfileComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();
    let formDebugEl = fixture.debugElement.query(By.directive(UserFormComponent));
    let formComponent = formDebugEl.componentInstance as UserFormComponent;
    expect(formComponent.mode()).toBe('view');

    component.onEdit();
    fixture.detectChanges();

    formDebugEl = fixture.debugElement.query(By.directive(UserFormComponent));
    formComponent = formDebugEl.componentInstance as UserFormComponent;
    expect(formComponent.mode()).toBe('edit');
  });

  it('should navigate to dashboard when cancel is triggered in view mode', () => {
    const fixture = TestBed.createComponent(ProfileComponent);
    const component = fixture.componentInstance;

    component.onCancel();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should return to view mode when cancel is triggered in edit mode', () => {
    const fixture = TestBed.createComponent(ProfileComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();
    component.onEdit();
    component.onCancel();

    expect(component.mode()).toBe('view');
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });
});
