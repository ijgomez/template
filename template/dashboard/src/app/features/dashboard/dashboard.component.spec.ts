import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';

import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose a fixed set of recent activity entries', () => {
    expect(component.recentActivity.length).toBe(5);
    for (const entry of component.recentActivity) {
      expect(entry.user).toBeTruthy();
      expect(entry.operation).toBeTruthy();
      expect(entry.section).toBeTruthy();
      expect(entry.badgeClass).toContain('bg-');
    }
  });

  it('should expose a last access value', () => {
    expect(component.lastAccess).toBeTruthy();
  });
});
