import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PwaUpdateComponent } from './core/components/pwa-update/pwa-update.component';
import { NotificationComponent } from './shared/components/notification/notification.component';
import { ErrorDialogComponent } from './shared/components/error-dialog/error-dialog.component';
import { OfflineBannerComponent } from './core/components/offline-banner/offline-banner.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PwaUpdateComponent, NotificationComponent, ErrorDialogComponent, OfflineBannerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
