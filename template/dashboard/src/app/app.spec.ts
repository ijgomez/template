import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { SwUpdate } from '@angular/service-worker';

import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    const swUpdateMock = {
      isEnabled: false,
      versionUpdates: { pipe: () => ({ subscribe: () => {} }) },
      checkForUpdate: () => Promise.resolve(false),
      activateUpdate: () => Promise.resolve(true),
    };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        { provide: SwUpdate, useValue: swUpdateMock },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
