import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, DestroyRef, Renderer2 } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd, ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { filter, fromEvent, Subject, takeUntil } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { ReportService } from '../../core/services/report.service';
import { Report } from '../../core/models/report.model';

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
  /** If true, labelKey is displayed as-is (not translated). Used for dynamic data like report names. */
  isRawLabel?: boolean;
}

/**
 * Represents a breadcrumb segment.
 */
export interface BreadcrumbSegment {
  label: string;
  path: string;
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
  private readonly reportService = inject(ReportService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly renderer = inject(Renderer2);

  /** Subject to signal end of a resize drag operation. */
  private readonly resizeStop$ = new Subject<void>();

  private static readonly STORAGE_KEY = 'tp-sidebar-collapsed';
  private static readonly WIDTH_STORAGE_KEY = 'tp-sidebar-width';
  private static readonly DEFAULT_WIDTH = 260;
  private static readonly MIN_WIDTH = 180;
  private static readonly MAX_WIDTH = 480;

  /** Breadcrumb segments built from current URL. */
  readonly breadcrumbs = signal<BreadcrumbSegment[]>([]);

  /** Whether the sidebar is collapsed. */
  readonly sidebarCollapsed = signal(false);

  /** Custom sidebar width in pixels (user-resizable). */
  readonly sidebarWidth = signal(LayoutComponent.DEFAULT_WIDTH);

  /** Whether a resize drag is in progress. */
  readonly resizing = signal(false);

  /** Whether the mobile menu overlay is open (< 992px). */
  readonly mobileMenuOpen = signal(false);

  /** Tracks which expandable sections are open by their labelKey. */
  readonly expandedSections = signal<Set<string>>(new Set());

  /** Current year for the footer copyright. */
  readonly currentYear = new Date().getFullYear();

  /** Username for display in the header. */
  readonly username = computed(() => this.authService.getCurrentUser()?.username ?? '');

  /** Full name computed from user profile (first + last). */
  readonly fullName = computed(() => {
    const user = this.authService.getCurrentUser();
    return user?.username ?? '';
  });

  /** User initials for the avatar. */
  readonly userInitials = computed(() => {
    const name = this.fullName();
    if (!name) return '';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  });

  /** User's assigned reports loaded dynamically for sidebar. */
  readonly userReports = signal<Report[]>([]);

  /** Dynamic nav items computed with user reports as children of "Informes". */
  readonly computedNavItems = computed<NavItem[]>(() => {
    const reports = this.userReports();
    const reportChildren: NavItem[] = reports.map((r) => ({
      labelKey: r.name,
      icon: 'file-earmark-text',
      route: `/reports/${r.id}`,
      actions: ['REPORT_EXECUTE'],
      isRawLabel: true,
    }));

    return [
      {
        labelKey: 'menu.dashboard',
        icon: 'speedometer2',
        route: '/dashboard',
        actions: ['DASHBOARD_READ'],
      },
      {
        labelKey: 'menu.reports',
        icon: 'file-earmark-bar-graph',
        actions: ['REPORT_EXECUTE'],
        children: reportChildren.length > 0 ? reportChildren : undefined,
        route: reportChildren.length === 0 ? '/reports' : undefined,
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
  });

  ngOnInit(): void {
    const saved = localStorage.getItem(LayoutComponent.STORAGE_KEY);
    if (saved === 'true') {
      this.sidebarCollapsed.set(true);
    }

    // Restore persisted sidebar width
    const savedWidth = localStorage.getItem(LayoutComponent.WIDTH_STORAGE_KEY);
    if (savedWidth) {
      const width = parseInt(savedWidth, 10);
      if (!isNaN(width) && width >= LayoutComponent.MIN_WIDTH && width <= LayoutComponent.MAX_WIDTH) {
        this.sidebarWidth.set(width);
      }
    }

    // Load user's assigned reports for sidebar navigation
    if (this.authService.hasAction('REPORT_EXECUTE')) {
      this.reportService.findUserReports().subscribe({
        next: (reports) => this.userReports.set(reports),
        error: () => { /* Sidebar will show "Informes" without children */ },
      });
    }

    // Build breadcrumbs on navigation
    this.updateBreadcrumbs();
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
    ).subscribe(() => this.updateBreadcrumbs());
  }

  /** Mapping from URL segments to translation keys. */
  private readonly segmentLabels: Record<string, string> = {
    dashboard: 'menu.dashboard',
    reports: 'menu.reports',
    interfaces: 'menu.interfaces',
    monitor: 'menu.interfaces.monitor',
    configuration: 'menu.interfaces.configuration',
    administration: 'menu.administration',
    security: 'menu.administration.security',
    users: 'menu.administration.security.users',
    profiles: 'menu.administration.security.profiles',
    actions: 'menu.administration.security.actions',
    parameters: 'menu.administration.parameters',
    audit: 'menu.administration.audit',
    cluster: 'menu.administration.cluster',
    nodes: 'menu.administration.cluster.nodes',
    blocks: 'menu.administration.cluster.blocks',
    profile: 'profile.title',
    forbidden: 'forbidden.title',
  };

  private updateBreadcrumbs(): void {
    const url = this.router.url.split('?')[0];
    const segments = url.split('/').filter((s) => s.length > 0);
    const crumbs: BreadcrumbSegment[] = [];
    let path = '';

    for (const segment of segments) {
      path += '/' + segment;
      const label = this.segmentLabels[segment] ?? segment;
      crumbs.push({ label, path });
    }

    this.breadcrumbs.set(crumbs);
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

  // ─── Sidebar Resize ──────────────────────────────────────────

  /**
   * Starts a sidebar resize drag operation on mousedown on the resize handle.
   * Listens to mousemove/mouseup on document to update width in real-time.
   */
  onSidebarResizeStart(event: MouseEvent): void {
    if (this.sidebarCollapsed()) return;

    event.preventDefault();
    this.resizing.set(true);

    const startX = event.clientX;
    const startWidth = this.sidebarWidth();

    this.renderer.addClass(document.body, 'tp-sidebar-resizing');

    fromEvent<MouseEvent>(document, 'mousemove')
      .pipe(takeUntil(this.resizeStop$), takeUntilDestroyed(this.destroyRef))
      .subscribe((moveEvent) => {
        const diff = moveEvent.clientX - startX;
        const newWidth = Math.max(
          LayoutComponent.MIN_WIDTH,
          Math.min(LayoutComponent.MAX_WIDTH, startWidth + diff),
        );
        this.sidebarWidth.set(newWidth);
      });

    fromEvent<MouseEvent>(document, 'mouseup')
      .pipe(takeUntil(this.resizeStop$), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.resizeStop$.next();
        this.resizing.set(false);
        this.renderer.removeClass(document.body, 'tp-sidebar-resizing');
        localStorage.setItem(LayoutComponent.WIDTH_STORAGE_KEY, String(this.sidebarWidth()));
      });
  }

  /** Resets the sidebar width to default on double-click on the resize handle. */
  onSidebarResizeReset(): void {
    this.sidebarWidth.set(LayoutComponent.DEFAULT_WIDTH);
    localStorage.setItem(LayoutComponent.WIDTH_STORAGE_KEY, String(LayoutComponent.DEFAULT_WIDTH));
  }
}
