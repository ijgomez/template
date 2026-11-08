import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { Observable, of, throwError } from 'rxjs';

import { LayoutComponent } from './layout.component';
import { AuthService } from '../services/auth.service';

/**
 * Behavior tests for LayoutComponent covering the sidebar resize drag, the
 * persisted sidebar state, logout failures and the rendered mobile backdrop
 * and breadcrumb. Complements layout.component.spec.ts.
 */
describe('LayoutComponent (behavior)', () => {
  let fixture: ComponentFixture<LayoutComponent>;
  let component: LayoutComponent;

  const authService = {
    getCurrentUser: () => ({ username: 'testuser', profile: 'ADMIN', actions: [], exp: 0, iat: 0 }),
    logout: (): Observable<void> => of(undefined as unknown as void),
    hasAction: () => true,
  };

  const el = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const byTestId = (id: string): HTMLElement | null => el().querySelector(`[data-testid="${id}"]`);

  const create = (): void => {
    fixture = TestBed.createComponent(LayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  const mouse = (type: string, clientX: number): void => {
    document.dispatchEvent(new MouseEvent(type, { clientX, bubbles: true }));
  };

  const startDrag = (clientX: number): MouseEvent => {
    const event = new MouseEvent('mousedown', { clientX, bubbles: true, cancelable: true });
    byTestId('sidebar-resize-handle')!.dispatchEvent(event);
    return event;
  };

  beforeEach(async () => {
    localStorage.removeItem('tp-sidebar-collapsed');
    localStorage.removeItem('tp-sidebar-width');

    await TestBed.configureTestingModule({
      imports: [LayoutComponent],
      providers: [
        provideRouter([]),
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.removeItem('tp-sidebar-collapsed');
    localStorage.removeItem('tp-sidebar-width');
    document.body.classList.remove('tp-sidebar-resizing');
    vi.restoreAllMocks();
  });

  describe('sidebar resize drag', () => {
    beforeEach(() => {
      create();
    });

    it('should start resizing on mousedown and prevent the default action', () => {
      const event = startDrag(260);

      expect(event.defaultPrevented).toBe(true);
      expect(component.resizing()).toBe(true);
      expect(document.body.classList.contains('tp-sidebar-resizing')).toBe(true);
    });

    it('should follow the mouse while dragging', () => {
      startDrag(260);

      mouse('mousemove', 310);

      expect(component.sidebarWidth()).toBe(310);
    });

    it('should clamp the width to the minimum and maximum', () => {
      startDrag(260);

      mouse('mousemove', 0);
      expect(component.sidebarWidth()).toBe(180);

      mouse('mousemove', 2000);
      expect(component.sidebarWidth()).toBe(480);
    });

    it('should persist the width and stop resizing on mouseup', () => {
      startDrag(260);
      mouse('mousemove', 300);

      mouse('mouseup', 300);

      expect(component.resizing()).toBe(false);
      expect(document.body.classList.contains('tp-sidebar-resizing')).toBe(false);
      expect(localStorage.getItem('tp-sidebar-width')).toBe('300');
    });

    it('should ignore further mouse moves after the drag ends', () => {
      startDrag(260);
      mouse('mousemove', 300);
      mouse('mouseup', 300);

      mouse('mousemove', 400);

      expect(component.sidebarWidth()).toBe(300);
    });

    it('should not start resizing when the sidebar is collapsed', () => {
      component.sidebarCollapsed.set(true);

      const event = startDrag(260);

      expect(event.defaultPrevented).toBe(false);
      expect(component.resizing()).toBe(false);
      expect(document.body.classList.contains('tp-sidebar-resizing')).toBe(false);
    });

    it('should reset the width on double click on the handle', () => {
      component.sidebarWidth.set(400);

      byTestId('sidebar-resize-handle')!.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));

      expect(component.sidebarWidth()).toBe(260);
    });
  });

  describe('persisted sidebar state', () => {
    it('should restore a valid saved width', () => {
      localStorage.setItem('tp-sidebar-width', '320');

      create();

      expect(component.sidebarWidth()).toBe(320);
    });

    it.each(['100', '900', 'abc'])('should ignore an invalid saved width (%s)', (saved) => {
      localStorage.setItem('tp-sidebar-width', saved);

      create();

      expect(component.sidebarWidth()).toBe(260);
    });

    it('should restore the collapsed state', () => {
      localStorage.setItem('tp-sidebar-collapsed', 'true');

      create();

      expect(component.sidebarCollapsed()).toBe(true);
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      create();
    });

    it('should redirect to login even when the logout request fails', () => {
      vi.spyOn(authService, 'logout').mockReturnValue(throwError(() => new Error('boom')));
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

      component.logout();

      expect(navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should log out from the user menu button', () => {
      const logout = vi.spyOn(authService, 'logout');
      vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

      byTestId('btn-logout')!.click();

      expect(logout).toHaveBeenCalledTimes(1);
    });
  });

  describe('mobile backdrop', () => {
    beforeEach(() => {
      create();
    });

    it('should render the backdrop only when the mobile menu is open and close it on click', () => {
      expect(byTestId('sidebar-backdrop')).toBeNull();

      component.toggleMobileMenu();
      fixture.detectChanges();
      expect(byTestId('sidebar-backdrop')).toBeTruthy();

      byTestId('sidebar-backdrop')!.click();
      expect(component.mobileMenuOpen()).toBe(false);
    });
  });

  describe('breadcrumb', () => {
    beforeEach(() => {
      create();
    });

    it('should render linked ancestors and the current page as active', () => {
      component.breadcrumbs.set([
        { label: 'menu.reports', path: '/reports', translatable: true },
        { label: 'Monthly report', path: '/reports/42', translatable: false },
      ]);
      fixture.detectChanges();

      const items = el().querySelectorAll('.breadcrumb-item');
      expect(items).toHaveLength(2);
      expect(items[0].querySelector('a')?.getAttribute('href')).toBe('/reports');
      expect(items[1].classList.contains('active')).toBe(true);
      expect(items[1].getAttribute('aria-current')).toBe('page');
      expect(items[1].textContent).toContain('Monthly report');
    });
  });
});
