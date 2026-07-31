import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthService } from '../../core/services/auth.service';

/**
 * Represents a navigation menu item in the sidebar.
 */
export interface NavItem {
  /** Translation key for the menu label. */
  labelKey: string;
  /** Bootstrap icon class (without 'bi-' prefix). */
  icon: string;
  /** Router link path (leaf items). */
  route?: string;
  /** Child items (expandable section). */
  children?: NavItem[];
  /** Action codes that grant visibility — item shows if user has at least one. */
  actions?: string[];
}

/**
 * Main layout component that wraps authenticated pages.
 * Provides a fixed header (56px), collapsible sidebar (260px/64px), scrollable content area, and footer.
 * Follows the layout specification defined in template-docs/03-technical/frontend/layout.md.
 *
 * Requirements: 6.1, 6.3, 6.8
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

  /** Whether the mobile menu overlay is open (< 992px). */
  readonly mobileMenuOpen = signal(false);

  /** Tracks which expandable sections are open by their labelKey. */
  readonly expandedSections = signal<Set<string>>(new Set());

  /** Current year for the footer copyright. */
  readonly currentYear = new Date().getFullYear();

  /** Username for display in the header. */
  readonly username = computed(() => this.authService.getCurrentUser()?.username ?? '');

  /** Full navigation menu structure with action-based visibility. */
  readonly navItems: NavItem[] = [
    {
      labelKey: 'menu.dashboard',
      icon: 'speedometer2',
      route: '/dashboard',
      actions: ['DASHBOARD_READ'],
    },
    {
      labelKey: 'menu.reports',
      icon: 'file-earmark-bar-graph',
      route: '/reports',
      actions: ['REPORT_EXECUTE'],
    },
    {
      labelKey: 'menu.interfaces',
      icon: 'diagram-3',
      actions: ['INTERFACES_READ'],
      children: [
        {
          labelKey: 'menu.interfaces.monitor',
          icon: 'activity',
          route: '/interfaces/monitor',
          actions: ['INTERFACES_READ'],
        },
        {
          labelKey: 'menu.interfaces.configuration',
          icon: 'gear',
          route: '/interfaces/configuration',
          actions: ['INTERFACES_READ'],
        },
      ],
    },
    {
      labelKey: 'menu.administration',
      icon: 'shield-lock',
      actions: [
        'USER_READ', 'USER_WRITE',
        'PROFILE_READ', 'PROFILE_WRITE',
        'ACTION_READ',
        'SYSTEM_PARAMETER_READ', 'SYSTEM_PARAMETER_WRITE',
        'SYSTEM_LOG_READ',
        'CLUSTER_NODE_READ', 'CLUSTER_NODE_WRITE',
        'CLUSTER_LOCK_READ',
      ],
      children: [
        {
          labelKey: 'menu.administration.security',
          icon: 'people',
          actions: ['USER_READ', 'USER_WRITE', 'PROFILE_READ', 'PROFILE_WRITE', 'ACTION_READ'],
          children: [
            {
              labelKey: 'menu.administration.security.users',
              icon: 'person',
              route: '/administration/security/users',
              actions: ['USER_READ', 'USER_WRITE'],
            },
            {
              labelKey: 'menu.administration.security.profiles',
              icon: 'person-badge',
              route: '/administration/security/profiles',
              actions: ['PROFILE_READ', 'PROFILE_WRITE'],
            },
            {
              labelKey: 'menu.administration.security.actions',
              icon: 'key',
              route: '/administration/security/actions',
              actions: ['ACTION_READ'],
            },
          ],
        },
        {
          labelKey: 'menu.administration.parameters',
          icon: 'sliders',
          route: '/administration/parameters',
          actions: ['SYSTEM_PARAMETER_READ', 'SYSTEM_PARAMETER_WRITE'],
        },
        {
          labelKey: 'menu.administration.audit',
          icon: 'journal-text',
          route: '/administration/audit',
          actions: ['SYSTEM_LOG_READ'],
        },
        {
          labelKey: 'menu.administration.cluster',
          icon: 'hdd-network',
          actions: ['CLUSTER_NODE_READ', 'CLUSTER_NODE_WRITE', 'CLUSTER_LOCK_READ'],
          children: [
            {
              labelKey: 'menu.administration.cluster.nodes',
              icon: 'hdd-rack',
              route: '/administration/cluster/nodes',
              actions: ['CLUSTER_NODE_READ', 'CLUSTER_NODE_WRITE'],
            },
            {
              labelKey: 'menu.administration.cluster.blocks',
              icon: 'lock',
              route: '/administration/cluster/blocks',
              actions: ['CLUSTER_LOCK_READ'],
            },
          ],
        },
      ],
    },
  ];

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

  /** Toggle the mobile menu overlay. */
  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  /** Close the mobile menu overlay. */
  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  /** Toggle an expandable section open/closed. */
  toggleSection(labelKey: string): void {
    this.expandedSections.update((sections) => {
      const updated = new Set(sections);
      if (updated.has(labelKey)) {
        updated.delete(labelKey);
      } else {
        updated.add(labelKey);
      }
      return updated;
    });
  }

  /** Check if a section is expanded. */
  isSectionExpanded(labelKey: string): boolean {
    return this.expandedSections().has(labelKey);
  }

  /** Check if a nav item is visible based on user actions. */
  isItemVisible(item: NavItem): boolean {
    if (!item.actions || item.actions.length === 0) {
      return true;
    }
    return item.actions.some((action) => this.authService.hasAction(action));
  }

  /** Logout the current user and redirect to login. */
  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}
