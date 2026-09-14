import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';

import { NotFoundComponent } from './not-found.component';

describe('NotFoundComponent', () => {
  let component: NotFoundComponent;
  let fixture: ComponentFixture<NotFoundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundComponent],
      providers: [
        provideRouter([]),
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotFoundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the 404 heading', () => {
    const heading = fixture.nativeElement.querySelector('h1');
    expect(heading.textContent).toContain('404');
  });

  it('should render a link back to the dashboard', () => {
    const link = fixture.nativeElement.querySelector('[data-testid="link-go-dashboard"]');
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toBe('/dashboard');
  });
});
