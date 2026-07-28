import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthService } from '../../core/services/auth.service';

/**
 * Main layout component that wraps authenticated pages.
 * Provides a fixed header (56px), collapsible sidebar (260px/64px), scrollable content area, and footer.
 * Follows the layout specification defined in template-docs/03-technical/frontend/layout.md.
 */
@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  private static readonly STORAGE_KEY = 'tp-sidebar-collapsed';

  /** Whether the sidebar is collapsed. */
  readonly sidebarCollapsed = signal(false);

  /** Current year for the footer copyright. */
  readonly currentYear = new Date().getFullYear();

  /** Username for display in the header. */
  readonly username = computed(() => this.authService.getCurrentUser()?.username ?? '');

  ngOnInit(): void {
    const saved = localStorage.getItem(LayoutComponent.STORAGE_KEY);
    if (saved === 'true') {
      this.sidebarCollapsed.set(true);
    }
  }

  /** Toggle the sidebar collapse state and persist it. */
  toggleSidebar(): void {
    this.sidebarCollapsed.update((collapsed) => !collapsed);
    localStorage.setItem(LayoutComponent.STORAGE_KEY, String(this.sidebarCollapsed()));
  }

  /** Logout the current user and redirect to login. */
  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}
