import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { Subject, of } from 'rxjs';

import { PwaUpdateService } from './pwa-update.service';

describe('PwaUpdateService', () => {
  let swUpdateMock: {
    isEnabled: boolean;
    versionUpdates: Subject<VersionReadyEvent>;
    activateUpdate: ReturnType<typeof vi.fn>;
    checkForUpdate: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    swUpdateMock = {
      isEnabled: true,
      versionUpdates: new Subject<VersionReadyEvent>(),
      activateUpdate: vi.fn().mockResolvedValue(undefined),
      checkForUpdate: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        PwaUpdateService,
        { provide: SwUpdate, useValue: swUpdateMock },
        { provide: ApplicationRef, useValue: { isStable: of(true) } },
      ],
    });
  });

  it('should schedule a check for updates when the app is stable and service worker is enabled', () => {
    TestBed.inject(PwaUpdateService);

    expect(swUpdateMock.checkForUpdate).toHaveBeenCalledTimes(1);
  });

  it('should emit true when a VERSION_READY event arrives', () => {
    const service = TestBed.inject(PwaUpdateService);
    let available = false;

    service.hasUpdate$.subscribe((value) => {
      available = value;
    });

    swUpdateMock.versionUpdates.next({ type: 'VERSION_READY' } as VersionReadyEvent);

    expect(available).toBe(true);
  });

  it('should dismiss the update warning without keeping it active', () => {
    const service = TestBed.inject(PwaUpdateService);
    const values: boolean[] = [];

    service.hasUpdate$.subscribe((value) => values.push(value));
    service.dismissUpdate();

    expect(values).toContain(false);
  });

  it('should activate the update and complete the reload flow', async () => {
    const service = TestBed.inject(PwaUpdateService) as any;
    const reloadSpy = vi.spyOn(service, 'reloadPage').mockImplementation(() => undefined);

    await service.activateUpdate();

    expect(swUpdateMock.activateUpdate).toHaveBeenCalledTimes(1);
    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });

  it('should not schedule checks when the service worker is disabled', () => {
    TestBed.resetTestingModule();
    swUpdateMock.isEnabled = false;

    TestBed.configureTestingModule({
      providers: [
        PwaUpdateService,
        { provide: SwUpdate, useValue: swUpdateMock },
        { provide: ApplicationRef, useValue: { isStable: of(true) } },
      ],
    });

    TestBed.inject(PwaUpdateService);

    expect(swUpdateMock.checkForUpdate).not.toHaveBeenCalled();
  });
});
