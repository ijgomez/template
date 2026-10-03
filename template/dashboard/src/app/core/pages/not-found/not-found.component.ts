import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * 404 Not Found page component.
 * Displays an error message and a link to navigate back to the Dashboard.
 *
 * Requirements: 7.12
 */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="d-flex flex-column align-items-center justify-content-center min-vh-100 text-center p-4">
      <h1 class="display-1 fw-bold text-muted">404</h1>
      <p class="fs-4 text-secondary mb-4">{{ 'notFound.message' | translate }}</p>
      <a routerLink="/dashboard" class="btn btn-primary" data-testid="link-go-dashboard">
        {{ 'notFound.goToDashboard' | translate }}
      </a>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {}
