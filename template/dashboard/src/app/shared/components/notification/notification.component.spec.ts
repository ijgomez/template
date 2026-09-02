import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { NotificationComponent } from './notification.component';
import { NotificationService } from '../../../core/services/notification.service';

describe('NotificationComponent', () => {
  let component: NotificationComponent;
  let fixture: ComponentFixture<NotificationComponent>;
  let notificationService: NotificationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationComponent],
      providers: [
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationComponent);
    component = fixture.componentInstance;
    notificationService = TestBed.inject(NotificationService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not render container when there are no notifications', () => {
    const container = fixture.nativeElement.querySelector('[data-testid="notification-container"]');
    expect(container).toBeNull();
  });

  it('should render a progress notification with spinner', () => {
    notificationService.showProgress('notification.progress');
    fixture.detectChanges();

    const container = fixture.nativeElement.querySelector('[data-testid="notification-container"]');
    expect(container).toBeTruthy();

    const spinner = fixture.nativeElement.querySelector('[data-testid="notification-spinner"]');
    expect(spinner).toBeTruthy();

    const toast = fixture.nativeElement.querySelector('[data-testid="notification-progress"]');
    expect(toast).toBeTruthy();
  });

  it('should render a success notification with check icon', () => {
    notificationService.showSuccess('notification.success');
    fixture.detectChanges();

    const toast = fixture.nativeElement.querySelector('[data-testid="notification-success"]');
    expect(toast).toBeTruthy();

    const icon = toast.querySelector('.bi-check-circle-fill');
    expect(icon).toBeTruthy();
  });

  it('should render an error notification with error icon', () => {
    notificationService.showError('notification.error');
    fixture.detectChanges();

    const toast = fixture.nativeElement.querySelector('[data-testid="notification-error"]');
    expect(toast).toBeTruthy();

    const icon = toast.querySelector('.bi-x-circle-fill');
    expect(icon).toBeTruthy();
  });

  it('should render a close button for each notification', () => {
    notificationService.showProgress('notification.progress');
    fixture.detectChanges();

    const dismissBtn = fixture.nativeElement.querySelector('[data-testid="notification-dismiss"]');
    expect(dismissBtn).toBeTruthy();
  });

  it('should dismiss a notification when close button is clicked', () => {
    notificationService.showProgress('notification.progress');
    fixture.detectChanges();

    const dismissBtn = fixture.nativeElement.querySelector('[data-testid="notification-dismiss"]');
    dismissBtn.click();
    fixture.detectChanges();

    const container = fixture.nativeElement.querySelector('[data-testid="notification-container"]');
    expect(container).toBeNull();
  });

  it('should render multiple notifications', () => {
    notificationService.showProgress('msg1');
    notificationService.showSuccess('msg2');
    notificationService.showError('msg3');
    fixture.detectChanges();

    const toasts = fixture.nativeElement.querySelectorAll('.toast');
    expect(toasts.length).toBe(3);
  });

  describe('getIconClass', () => {
    it('should return empty string for progress', () => {
      expect(component.getIconClass({ id: '1', type: 'progress', messageKey: '', createdAt: 0 })).toBe('');
    });

    it('should return success icon class', () => {
      expect(component.getIconClass({ id: '1', type: 'success', messageKey: '', createdAt: 0 })).toContain('bi-check-circle-fill');
    });

    it('should return error icon class', () => {
      expect(component.getIconClass({ id: '1', type: 'error', messageKey: '', createdAt: 0 })).toContain('bi-x-circle-fill');
    });
  });

  describe('getToastClass', () => {
    it('should return primary border for progress', () => {
      expect(component.getToastClass({ id: '1', type: 'progress', messageKey: '', createdAt: 0 })).toContain('border-primary');
    });

    it('should return success border for success', () => {
      expect(component.getToastClass({ id: '1', type: 'success', messageKey: '', createdAt: 0 })).toContain('border-success');
    });

    it('should return danger border for error', () => {
      expect(component.getToastClass({ id: '1', type: 'error', messageKey: '', createdAt: 0 })).toContain('border-danger');
    });
  });
});
