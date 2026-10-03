import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';

import { ForbiddenComponent } from './forbidden.component';

describe('ForbiddenComponent', () => {
  let component: ForbiddenComponent;
  let fixture: ComponentFixture<ForbiddenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForbiddenComponent],
      providers: [
        provideRouter([]),
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ForbiddenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the 403 heading', () => {
    const heading = fixture.nativeElement.querySelector('#forbidden-title');
    expect(heading).toBeTruthy();
    expect(heading.textContent).toContain('403');
  });

  it('should expose a main landmark labelled by the heading', () => {
    const main = fixture.nativeElement.querySelector('[role="main"]');
    expect(main).toBeTruthy();
    expect(main.getAttribute('aria-labelledby')).toBe('forbidden-title');
  });

  it('should render a link back to the dashboard', () => {
    const link = fixture.nativeElement.querySelector('[data-testid="link-go-dashboard"]');
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toBe('/dashboard');
  });
});
