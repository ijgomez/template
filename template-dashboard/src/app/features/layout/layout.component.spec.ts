import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { LayoutComponent } from './layout.component';
import { AuthService } from '../../core/services/auth.service';

describe('LayoutComponent', () => {
  let component: LayoutComponent;
  let fixture: ComponentFixture<LayoutComponent>;
  let authServiceMock: Partial<AuthService>;

  beforeEach(async () => {
    authServiceMock = {
      getCurrentUser: () => ({
        username: 'testuser',
        profile: 'ADMIN',
        actions: ['DASHBOARD_READ'],
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      }),
      logout: () => of(undefined as unknown as void),
    };

    await TestBed.configureTestingModule({
      imports: [LayoutComponent],
      providers: [
        provideRouter([]),
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the username from AuthService', () => {
    expect(component.username()).toBe('testuser');
  });

  it('should initialize sidebar as expanded', () => {
    expect(component.sidebarCollapsed()).toBe(false);
  });

  it('should toggle sidebar collapsed state', () => {
    expect(component.sidebarCollapsed()).toBe(false);

    component.toggleSidebar();
    expect(component.sidebarCollapsed()).toBe(true);

    component.toggleSidebar();
    expect(component.sidebarCollapsed()).toBe(false);
  });

  it('should persist sidebar state in localStorage', () => {
    component.toggleSidebar();
    expect(localStorage.getItem('tp-sidebar-collapsed')).toBe('true');

    component.toggleSidebar();
    expect(localStorage.getItem('tp-sidebar-collapsed')).toBe('false');
  });

  it('should restore sidebar state from localStorage on init', async () => {
    localStorage.setItem('tp-sidebar-collapsed', 'true');

    const newFixture = TestBed.createComponent(LayoutComponent);
    const newComponent = newFixture.componentInstance;
    newComponent.ngOnInit();

    expect(newComponent.sidebarCollapsed()).toBe(true);
  });

  it('should have the current year', () => {
    expect(component.currentYear).toBe(new Date().getFullYear());
  });

  it('should render the header with banner role', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const header = compiled.querySelector('[role="banner"]');
    expect(header).toBeTruthy();
  });

  it('should render the sidebar with navigation role', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const sidebar = compiled.querySelector('[role="navigation"]');
    expect(sidebar).toBeTruthy();
  });

  it('should render the main content area', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const mainContent = compiled.querySelector('[role="main"]');
    expect(mainContent).toBeTruthy();
  });

  it('should render the footer with contentinfo role', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const footer = compiled.querySelector('[role="contentinfo"]');
    expect(footer).toBeTruthy();
  });

  it('should have data-testid on interactive elements', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('[data-testid="btn-sidebar-toggle"]')).toBeTruthy();
    expect(compiled.querySelector('[data-testid="link-brand"]')).toBeTruthy();
    expect(compiled.querySelector('[data-testid="btn-user-menu"]')).toBeTruthy();
    expect(compiled.querySelector('[data-testid="nav-dashboard"]')).toBeTruthy();
  });

  it('should toggle sidebar-collapsed class on wrapper', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const wrapper = compiled.querySelector('.tp-wrapper');

    expect(wrapper?.classList.contains('sidebar-collapsed')).toBe(false);

    component.toggleSidebar();
    fixture.detectChanges();

    expect(wrapper?.classList.contains('sidebar-collapsed')).toBe(true);
  });

  it('should set aria-expanded attribute on toggle button', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const toggleBtn = compiled.querySelector('[data-testid="btn-sidebar-toggle"]');

    expect(toggleBtn?.getAttribute('aria-expanded')).toBe('true');

    component.toggleSidebar();
    fixture.detectChanges();

    expect(toggleBtn?.getAttribute('aria-expanded')).toBe('false');
  });

  afterEach(() => {
    localStorage.removeItem('tp-sidebar-collapsed');
  });
});
