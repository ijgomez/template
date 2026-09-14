import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { ErrorDialogComponent } from './error-dialog.component';
import { NotificationService } from '../../../core/services/notification.service';

describe('ErrorDialogComponent', () => {
  let component: ErrorDialogComponent;
  let fixture: ComponentFixture<ErrorDialogComponent>;
  let notificationService: NotificationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorDialogComponent],
      providers: [
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorDialogComponent);
    component = fixture.componentInstance;
    notificationService = TestBed.inject(NotificationService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not render the dialog when there are no error notifications', () => {
    const dialog = fixture.nativeElement.querySelector('[data-testid="error-dialog"]');
    expect(dialog).toBeNull();
  });

  it('should not render the dialog for non-error notifications', () => {
    notificationService.showProgress('op.inProgress');
    notificationService.showSuccess('op.done');
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('[data-testid="error-dialog"]');
    expect(dialog).toBeNull();
  });

  it('should render a modal dialog when an error notification is present', () => {
    notificationService.showError('error.generic');
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('[data-testid="error-dialog"]');
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('role')).toBe('dialog');
  });

  it('should render the literal backend message when provided', () => {
    notificationService.showError('error.generic', 'Concrete backend message');
    fixture.detectChanges();

    const body = fixture.nativeElement.querySelector('[data-testid^="error-message-"]');
    expect(body).toBeTruthy();
    expect(body.textContent).toContain('Concrete backend message');
  });

  it('should dismiss all errors when the accept button is clicked', () => {
    notificationService.showError('error.one');
    notificationService.showError('error.two');
    fixture.detectChanges();

    const acceptBtn = fixture.nativeElement.querySelector('[data-testid="error-dialog-accept"]');
    expect(acceptBtn).toBeTruthy();
    acceptBtn.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="error-dialog"]')).toBeNull();
  });

  describe('dismissAll', () => {
    it('should dismiss each provided error via the notification service', () => {
      let dismissed = 0;
      const originalDismiss = notificationService.dismiss.bind(notificationService);
      notificationService.dismiss = (id: string) => {
        dismissed++;
        originalDismiss(id);
      };

      component.dismissAll([
        { id: 'a', type: 'error', messageKey: 'x', createdAt: 0 },
        { id: 'b', type: 'error', messageKey: 'y', createdAt: 0 },
      ]);

      expect(dismissed).toBe(2);
    });
  });
});
