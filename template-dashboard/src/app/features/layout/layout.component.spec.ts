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
        actions: [
          'DASHBOARD_READ',
          'REPORT_EXECUTE',
          'INTERFACES_READ',
          'USER_READ',
          'USER_WRITE',
          'PROFILE_READ',
          'PROFILE_WRITE',
          'ACTION_READ',
          'SYSTEM_PARAMETER_READ',
          'SYSTEM_PARAMETER_WRITE',
          'SYSTEM_LOG_READ',
          'CLUSTER_NODE_READ',
          'CLUSTER_NODE_WRITE',
          'CLUSTER_LOCK_READ',
        ],
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      }),
      logout: () => of(undefined as unknown as void),
      hasAction: (actionCode: string) => {
        const actions = [
          'DASHBOARD_READ',
          'REPORT_EXECUTE',
          'INTERFACES_READ',
          'USER_READ',
          'USER_WRITE',
          'PROFILE_READ',
          'PROFILE_WRITE',
          'ACTION_READ',
          'SYSTEM_PARAMETER_READ',
          'SYSTEM_PARAMETER_WRITE',
          'SYSTEM_LOG_READ',
          'CLUSTER_NODE_READ',
          'CLUSTER_NODE_WRITE',
          'CLUSTER_LOCK_READ',
        ];
        return actions.includes(actionCode);
      },
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

  it('should restore sidebar state from localStorage on init', () => {
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

  // ─── Navigation menu tests ───────────────────────────────────

  it('should render the Dashboard navigation item', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const dashboardNav = compiled.querySelector('[data-testid="nav-menu.dashboard"]');
    expect(dashboardNav).toBeTruthy();
  });

  it('should render expandable sections with toggle buttons', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const interfacesToggle = compiled.querySelector('[data-testid="nav-toggle-menu.interfaces"]');
    expect(interfacesToggle).toBeTruthy();
  });

  it('should expand/collapse sections on toggle click', () => {
    expect(component.isSectionExpanded('menu.interfaces')).toBe(false);

    component.toggleSection('menu.interfaces');
    expect(component.isSectionExpanded('menu.interfaces')).toBe(true);

    component.toggleSection('menu.interfaces');
    expect(component.isSectionExpanded('menu.interfaces')).toBe(false);
  });

  it('should show child items when section is expanded', () => {
    component.toggleSection('menu.interfaces');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const monitorLink = compiled.querySelector('[data-testid="nav-menu.interfaces.monitor"]');
    expect(monitorLink).toBeTruthy();
  });

  it('should hide child items when section is collapsed', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const monitorLink = compiled.querySelector('[data-testid="nav-menu.interfaces.monitor"]');
    expect(monitorLink).toBeNull();
  });

  it('should support nested expandable sections (Administration > Security)', () => {
    component.toggleSection('menu.administration');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const securityToggle = compiled.querySelector(
      '[data-testid="nav-toggle-menu.administration.security"]',
    );
    expect(securityToggle).toBeTruthy();
  });

  it('should show third-level items when nested section is expanded', () => {
    component.toggleSection('menu.administration');
    component.toggleSection('menu.administration.security');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const usersLink = compiled.querySelector(
      '[data-testid="nav-menu.administration.security.users"]',
    );
    expect(usersLink).toBeTruthy();
  });

  it('should hide items user does not have actions for', () => {
    // Create a new test with limited actions
    const limitedAuthService: Partial<AuthService> = {
      getCurrentUser: () => ({
        username: 'limited',
        profile: 'BASIC',
        actions: ['DASHBOARD_READ'],
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      }),
      logout: () => of(undefined as unknown as void),
      hasAction: (actionCode: string) => actionCode === 'DASHBOARD_READ',
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [LayoutComponent],
      providers: [
        provideRouter([]),
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        { provide: AuthService, useValue: limitedAuthService },
      ],
    });

    const limitedFixture = TestBed.createComponent(LayoutComponent);
    limitedFixture.detectChanges();

    const compiled = limitedFixture.nativeElement as HTMLElement;
    // Dashboard should be visible
    const dashboardNav = compiled.querySelector('[data-testid="nav-menu.dashboard"]');
    expect(dashboardNav).toBeTruthy();

    // Reports should NOT be visible (no REPORT_EXECUTE action)
    const reportsNav = compiled.querySelector('[data-testid="nav-menu.reports"]');
    expect(reportsNav).toBeNull();

    // Administration section should NOT be visible
    const adminToggle = compiled.querySelector('[data-testid="nav-toggle-menu.administration"]');
    expect(adminToggle).toBeNull();
  });

  it('should toggle mobile menu', () => {
    expect(component.mobileMenuOpen()).toBe(false);

    component.toggleMobileMenu();
    expect(component.mobileMenuOpen()).toBe(true);

    component.closeMobileMenu();
    expect(component.mobileMenuOpen()).toBe(false);
  });

  it('should define the complete navigation structure', () => {
    expect(component.navItems.length).toBe(4); // Dashboard, Reports, Interfaces, Administration
    expect(component.navItems[0].labelKey).toBe('menu.dashboard');
    expect(component.navItems[1].labelKey).toBe('menu.reports');
    expect(component.navItems[2].labelKey).toBe('menu.interfaces');
    expect(component.navItems[3].labelKey).toBe('menu.administration');
  });

  it('should have correct navigation hierarchy for Administration', () => {
    const admin = component.navItems[3];
    expect(admin.children?.length).toBe(4); // Security, Parameters, Audit, Cluster

    const security = admin.children![0];
    expect(security.labelKey).toBe('menu.administration.security');
    expect(security.children?.length).toBe(3); // Users, Profiles, Actions

    const cluster = admin.children![3];
    expect(cluster.labelKey).toBe('menu.administration.cluster');
    expect(cluster.children?.length).toBe(2); // Nodes, Blocks
  });

  afterEach(() => {
    localStorage.removeItem('tp-sidebar-collapsed');
  });
});
