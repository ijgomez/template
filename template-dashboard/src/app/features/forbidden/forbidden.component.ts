import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * 403 Forbidden page component.
 * Displays an access denied message and a link to navigate back to the Dashboard.
 */
@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <div
      class="d-flex flex-column align-items-center justify-content-center min-vh-100 text-center p-4"
      role="main"
      aria-labelledby="forbidden-title"
    >
      <h1 id="forbidden-title" class="display-1 fw-bold text-muted">403</h1>
      <p class="fs-4 text-secondary mb-4">{{ 'forbidden.message' | translate }}</p>
      <a routerLink="/dashboard" class="btn btn-primary" data-testid="link-go-dashboard">
        {{ 'forbidden.goToDashboard' | translate }}
      </a>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForbiddenComponent {}
