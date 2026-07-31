import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { ConnectivityService } from '../../services/connectivity.service';

/**
 * Displays a warning banner when the application is offline.
 * The banner auto-hides when connectivity is restored.
 * Cached static resources remain available via the service worker.
 */
@Component({
  selector: 'app-offline-banner',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    @if (!connectivityService.isOnline()) {
      <div class="alert alert-warning d-flex align-items-center mb-0 rounded-0 border-0"
           role="alert"
           aria-live="assertive"
           data-testid="offline-banner">
        <i class="bi bi-wifi-off me-2" aria-hidden="true"></i>
        <span>{{ 'pwa.offline.message' | translate }}</span>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
    }
    .alert {
      position: sticky;
      top: 0;
      z-index: 1050;
      font-size: 0.875rem;
      padding: 0.5rem 1rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfflineBannerComponent {
  readonly connectivityService = inject(ConnectivityService);
}
