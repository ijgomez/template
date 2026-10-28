import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { throwError } from 'rxjs';
import { vi } from 'vitest';

import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let loginMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    loginMock = vi.fn();
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        { provide: AuthService, useValue: { login: loginMock } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function submitValidCredentials(): void {
    component.loginForm.setValue({ username: 'admin', password: 'secret', remember: false });
    component.onSubmit();
    fixture.detectChanges();
  }

  it('shows the invalid-credentials alert when the server responds 401', () => {
    loginMock.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));

    submitValidCredentials();

    expect(fixture.nativeElement.querySelector('[data-testid="login-error-alert"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="login-locked-alert"]')).toBeNull();
  });

  it('shows the temporary lockout alert when the server responds 429', () => {
    loginMock.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 429 })));

    submitValidCredentials();

    expect(fixture.nativeElement.querySelector('[data-testid="login-locked-alert"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="login-error-alert"]')).toBeNull();
  });
});
