import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Notification, NotificationType } from '../models/notification.model';

/**
 * Service for managing user-facing notifications (toasts and error dialogs).
 *
 * Supports three types:
 * - progress: shown while an operation is in-flight (spinner indicator)
 * - success: shown on completion, auto-dismisses after 5 seconds
 * - error: shown as a modal dialog requiring user acknowledgment (no auto-dismiss)
 *
 * Progress notifications can transition to success or error via
 * updateToSuccess() / updateToError().
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private static readonly SUCCESS_DISMISS_MS = 5000;
  private static readonly ERROR_DISMISS_MS = 8000;

  private readonly notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  /** Observable stream of active notifications for the component to consume. */
  readonly notifications$: Observable<Notification[]> = this.notificationsSubject.asObservable();

  /**
   * Shows a progress notification (no auto-dismiss).
   * @returns notification ID for later transition or dismiss.
   */
  showProgress(messageKey: string): string {
    const notification = this.createNotification('progress', messageKey);
    this.addNotification(notification);
    return notification.id;
  }

  /**
   * Shows a success notification that auto-dismisses after 5 seconds.
   */
  showSuccess(messageKey: string): void {
    const notification = this.createNotification('success', messageKey);
    this.addNotification(notification);
    this.scheduleAutoDismiss(notification.id, NotificationService.SUCCESS_DISMISS_MS);
  }

  /**
   * Shows an error notification displayed as a modal dialog.
   * Does NOT auto-dismiss — the user must acknowledge the error manually.
   * @param messageKey i18n translation key for the error category.
   * @param message Optional literal message from the backend for additional detail.
   */
  showError(messageKey: string, message?: string): void {
    const notification = this.createNotification('error', messageKey);
    if (message) {
      notification.message = message;
    }
    this.addNotification(notification);
  }

  /**
   * Transitions a progress notification to success (auto-dismiss 5s).
   */
  updateToSuccess(notificationId: string, messageKey: string): void {
    this.updateNotification(notificationId, 'success', messageKey);
    this.scheduleAutoDismiss(notificationId, NotificationService.SUCCESS_DISMISS_MS);
  }

  /**
   * Transitions a progress notification to error (displayed as modal, no auto-dismiss).
   */
  updateToError(notificationId: string, messageKey: string): void {
    this.updateNotification(notificationId, 'error', messageKey);
  }

  /**
   * Manually dismisses a notification by ID.
   */
  dismiss(notificationId: string): void {
    this.clearTimer(notificationId);
    const current = this.notificationsSubject.getValue();
    this.notificationsSubject.next(current.filter(n => n.id !== notificationId));
  }

  private createNotification(type: NotificationType, messageKey: string): Notification {
    return {
      id: this.generateId(),
      type,
      messageKey,
      createdAt: Date.now()
    };
  }

  private addNotification(notification: Notification): void {
    const current = this.notificationsSubject.getValue();
    this.notificationsSubject.next([...current, notification]);
  }

  private updateNotification(id: string, type: NotificationType, messageKey: string): void {
    this.clearTimer(id);
    const current = this.notificationsSubject.getValue();
    const updated = current.map(n =>
      n.id === id ? { ...n, type, messageKey } : n
    );
    this.notificationsSubject.next(updated);
  }

  private scheduleAutoDismiss(id: string, delayMs: number): void {
    this.clearTimer(id);
    const timer = setTimeout(() => {
      this.dismiss(id);
    }, delayMs);
    this.timers.set(id, timer);
  }

  private clearTimer(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }

  private generateId(): string {
    return `ntf-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}
