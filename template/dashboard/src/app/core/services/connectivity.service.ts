import { Injectable, signal, OnDestroy } from '@angular/core';

/**
 * Service for detecting online/offline status.
 * Monitors browser connectivity events and exposes a reactive signal.
 * When offline, cached static resources remain available via service worker.
 * Full functionality auto-recovers when connection is restored.
 */
@Injectable({ providedIn: 'root' })
export class ConnectivityService implements OnDestroy {
  /** Whether the application currently has network connectivity. */
  readonly isOnline = signal(navigator.onLine);

  private readonly onlineHandler = (): void => this.isOnline.set(true);
  private readonly offlineHandler = (): void => this.isOnline.set(false);

  constructor() {
    globalThis.addEventListener('online', this.onlineHandler);
    globalThis.addEventListener('offline', this.offlineHandler);
  }

  ngOnDestroy(): void {
    globalThis.removeEventListener('online', this.onlineHandler);
    globalThis.removeEventListener('offline', this.offlineHandler);
  }
}
