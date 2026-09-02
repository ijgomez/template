import { Injectable, inject, ApplicationRef } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { BehaviorSubject, Observable, filter, first, interval, concat } from 'rxjs';

/**
 * Service responsible for detecting and managing PWA updates.
 * Checks for new versions periodically and provides an observable
 * for components to react to available updates.
 */
@Injectable({ providedIn: 'root' })
export class PwaUpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly appRef = inject(ApplicationRef);

  private readonly updateAvailable$ = new BehaviorSubject<boolean>(false);

  /** Emits true when a new version is available for activation */
  readonly hasUpdate$: Observable<boolean> = this.updateAvailable$.asObservable();

  constructor() {
    if (this.swUpdate.isEnabled) {
      this.listenForUpdates();
      this.scheduleUpdateChecks();
    }
  }

  /**
   * Activates the new version and reloads the application.
   */
  activateUpdate(): void {
    this.swUpdate.activateUpdate().then(() => {
      document.location.reload();
    });
  }

  /**
   * Dismisses the update notification without applying the update.
   */
  dismissUpdate(): void {
    this.updateAvailable$.next(false);
  }

  private listenForUpdates(): void {
    this.swUpdate.versionUpdates
      .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
      .subscribe(() => {
        this.updateAvailable$.next(true);
      });
  }

  private scheduleUpdateChecks(): void {
    const appIsStable$ = this.appRef.isStable.pipe(first((stable) => stable));
    const checkInterval$ = interval(6 * 60 * 60 * 1000); // Every 6 hours

    concat(appIsStable$, checkInterval$).subscribe(() => {
      this.swUpdate.checkForUpdate();
    });
  }
}
