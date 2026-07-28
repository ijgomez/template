import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Placeholder login component.
 * Will be implemented fully in a later task.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="container d-flex justify-content-center align-items-center vh-100">
      <h1>{{ 'login.title' | translate }}</h1>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {}
