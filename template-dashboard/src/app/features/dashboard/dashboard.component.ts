import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Placeholder dashboard component.
 * Will be implemented fully in a later task.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <h1>{{ 'menu.dashboard' | translate }}</h1>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {}
