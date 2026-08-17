import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NotificationService } from '../../../core/services/notification.service';
import { Notification } from '../../../core/models/notification.model';

/**
 * Modal dialog that displays error notifications from the backend.
 * Requires user acknowledgment (click "Aceptar") to dismiss.
 * Replaces the auto-dismissing toast for error-type notifications.
 */
@Component({
  selector: 'app-error-dialog',
  standalone: true,
  imports: [AsyncPipe, TranslatePipe],
  templateUrl: './error-dialog.component.html',
  styleUrl: './error-dialog.component.scss'
})
export class ErrorDialogComponent {
  private readonly notificationService = inject(NotificationService);

  readonly errorNotifications$: Observable<Notification[]> = this.notificationService.notifications$.pipe(
    map(notifications => notifications.filter(n => n.type === 'error'))
  );

  dismissAll(errors: Notification[]): void {
    errors.forEach(error => this.notificationService.dismiss(error.id));
  }
}
