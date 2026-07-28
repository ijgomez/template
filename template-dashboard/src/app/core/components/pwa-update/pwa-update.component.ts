import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { PwaUpdateService } from '../../services/pwa-update.service';

@Component({
  selector: 'app-pwa-update',
  standalone: true,
  imports: [AsyncPipe, TranslatePipe],
  templateUrl: './pwa-update.component.html',
  styleUrl: './pwa-update.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PwaUpdateComponent {
  private readonly pwaUpdateService = inject(PwaUpdateService);

  readonly hasUpdate$ = this.pwaUpdateService.hasUpdate$;

  onUpdate(): void {
    this.pwaUpdateService.activateUpdate();
  }

  onDismiss(): void {
    this.pwaUpdateService.dismissUpdate();
  }
}
