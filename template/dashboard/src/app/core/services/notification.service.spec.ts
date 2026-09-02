import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NotificationService } from './notification.service';
import { Notification } from '../models/notification.model';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationService);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('showProgress', () => {
    it('should add a progress notification and return its ID', () => {
      const id = service.showProgress('notification.progress');

      expect(id).toBeTruthy();
      let notifications: Notification[] = [];
      service.notifications$.subscribe(n => (notifications = n));
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('progress');
      expect(notifications[0].messageKey).toBe('notification.progress');
      expect(notifications[0].id).toBe(id);
    });

    it('should not auto-dismiss progress notifications', () => {
      service.showProgress('notification.progress');

      vi.advanceTimersByTime(60000);

      let notifications: Notification[] = [];
      service.notifications$.subscribe(n => (notifications = n));
      expect(notifications).toHaveLength(1);
    });
  });

  describe('showSuccess', () => {
    it('should add a success notification', () => {
      service.showSuccess('notification.success');

      let notifications: Notification[] = [];
      service.notifications$.subscribe(n => (notifications = n));
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('success');
    });

    it('should auto-dismiss after 5 seconds', () => {
      service.showSuccess('notification.success');

      let notifications: Notification[] = [];
      service.notifications$.subscribe(n => (notifications = n));
      expect(notifications).toHaveLength(1);

      vi.advanceTimersByTime(5000);
      expect(notifications).toHaveLength(0);
    });
  });

  describe('showError', () => {
    it('should add an error notification', () => {
      service.showError('notification.error');

      let notifications: Notification[] = [];
      service.notifications$.subscribe(n => (notifications = n));
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('error');
    });

    it('should auto-dismiss after 8 seconds', () => {
      service.showError('notification.error');

      let notifications: Notification[] = [];
      service.notifications$.subscribe(n => (notifications = n));
      expect(notifications).toHaveLength(1);

      vi.advanceTimersByTime(8000);
      expect(notifications).toHaveLength(0);
    });
  });

  describe('updateToSuccess', () => {
    it('should transition a progress notification to success', () => {
      const id = service.showProgress('notification.progress');

      service.updateToSuccess(id, 'notification.success');

      let notifications: Notification[] = [];
      service.notifications$.subscribe(n => (notifications = n));
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('success');
      expect(notifications[0].messageKey).toBe('notification.success');
    });

    it('should auto-dismiss the transitioned notification after 5 seconds', () => {
      const id = service.showProgress('notification.progress');

      service.updateToSuccess(id, 'notification.success');

      let notifications: Notification[] = [];
      service.notifications$.subscribe(n => (notifications = n));

      vi.advanceTimersByTime(5000);
      expect(notifications).toHaveLength(0);
    });
  });

  describe('updateToError', () => {
    it('should transition a progress notification to error', () => {
      const id = service.showProgress('notification.progress');

      service.updateToError(id, 'notification.error');

      let notifications: Notification[] = [];
      service.notifications$.subscribe(n => (notifications = n));
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('error');
      expect(notifications[0].messageKey).toBe('notification.error');
    });

    it('should auto-dismiss the transitioned notification after 8 seconds', () => {
      const id = service.showProgress('notification.progress');

      service.updateToError(id, 'notification.error');

      let notifications: Notification[] = [];
      service.notifications$.subscribe(n => (notifications = n));

      vi.advanceTimersByTime(8000);
      expect(notifications).toHaveLength(0);
    });
  });

  describe('dismiss', () => {
    it('should remove a notification by ID', () => {
      const id = service.showProgress('notification.progress');

      service.dismiss(id);

      let notifications: Notification[] = [];
      service.notifications$.subscribe(n => (notifications = n));
      expect(notifications).toHaveLength(0);
    });

    it('should only remove the targeted notification', () => {
      const id1 = service.showProgress('msg1');
      service.showProgress('msg2');

      service.dismiss(id1);

      let notifications: Notification[] = [];
      service.notifications$.subscribe(n => (notifications = n));
      expect(notifications).toHaveLength(1);
      expect(notifications[0].messageKey).toBe('msg2');
    });

    it('should cancel auto-dismiss timer when manually dismissed', () => {
      service.showSuccess('notification.success');

      let notifications: Notification[] = [];
      service.notifications$.subscribe(n => (notifications = n));
      const id = notifications[0].id;

      service.dismiss(id);
      expect(notifications).toHaveLength(0);

      // Timer should not cause errors after manual dismiss
      vi.advanceTimersByTime(5000);
      expect(notifications).toHaveLength(0);
    });
  });

  describe('multiple notifications', () => {
    it('should support multiple concurrent notifications', () => {
      service.showProgress('msg1');
      service.showSuccess('msg2');
      service.showError('msg3');

      let notifications: Notification[] = [];
      service.notifications$.subscribe(n => (notifications = n));
      expect(notifications).toHaveLength(3);
    });
  });
});
