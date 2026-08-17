import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NotificationService } from '../../../core/services/notification.service';
import { Notification } from '../../../core/models/notification.model';

/**
 * Toast-style notification container rendered at the top-right of the viewport.
 * Subscribes to NotificationService.notifications$ and renders progress/success notifications.
 * Error notifications are handled by ErrorDialogComponent as a modal dialog.
 */
@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [AsyncPipe, TranslatePipe],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.scss'
})
export class NotificationComponent {
  private readonly notificationService = inject(NotificationService);

  readonly notifications$: Observable<Notification[]> = this.notificationService.notifications$.pipe(
    map(notifications => notifications.filter(n => n.type !== 'error'))
  );

  dismiss(notification: Notification): void {
    this.notificationService.dismiss(notification.id);
  }

  getIconClass(notification: Notification): string {
    switch (notification.type) {
      case 'progress':
        return '';
      case 'success':
        return 'bi bi-check-circle-fill text-success';
      case 'error':
        return 'bi bi-x-circle-fill text-danger';
    }
  }

  getToastClass(notification: Notification): string {
    switch (notification.type) {
      case 'progress':
        return 'border-primary';
      case 'success':
        return 'border-success';
      case 'error':
        return 'border-danger';
    }
  }
}
