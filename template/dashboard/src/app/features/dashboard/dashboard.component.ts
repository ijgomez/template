import { Component, ChangeDetectionStrategy, DestroyRef, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { ClusterService } from '../../core/services/cluster.service';
import { InterfaceService } from '../../core/services/interface.service';
import { UserService } from '../../core/services/user.service';

/** Interval (ms) used to recompute the "updated X ago" freshness label. */
const FRESHNESS_TICK_MS = 30_000;

/**
 * Dashboard component: system health overview for the administrator/operator.
 *
 * Zones: system health (nodes + interfaces in error), context (users, configured
 * interfaces) and subordinated chrome (system status + quick links).
 *
 * NOTE: bridge implementation (spec dashboard-stats, Fase 4). Each block is loaded
 * from existing endpoints, independently, until the `GET /dashboard/stats` summary
 * endpoint exists. No value is hardcoded: blocks without a real source are omitted.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly clusterService = inject(ClusterService);
  private readonly userService = inject(UserService);
  private readonly interfaceService = inject(InterfaceService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  /** Environment name taken from the Angular environment file. */
  readonly environmentName = environment.environmentName;

  // ─── Permissions (RF-5) ──────────────────────────────────────
  // Same authorities the backend accepts for each underlying GET endpoint (SecurityConfig).
  readonly canReadUsers = this.hasAny('USER_READ', 'USER_WRITE');
  readonly canReadInterfaces = this.hasAny('INTERFACES_READ');
  readonly canReadNodes = this.hasAny('CLUSTER_NODE_READ', 'CLUSTER_NODE_WRITE');

  // ─── Cluster nodes state ─────────────────────────────────────
  readonly nodesLoading = signal(this.canReadNodes);
  readonly nodesError = signal(false);
  readonly activeNodes = signal(0);
  readonly totalNodes = signal(0);
  /** Hostname of the master node, or null when unknown. */
  readonly masterNode = signal<string | null>(null);
  /** Start instant of the master node (ISO string), or null when unknown. */
  readonly masterStartedAt = signal<string | null>(null);

  readonly inactiveNodes = computed(() => this.totalNodes() - this.activeNodes());
  readonly allNodesOperational = computed(() => this.totalNodes() > 0 && this.inactiveNodes() === 0);

  // ─── Users state ─────────────────────────────────────────────
  readonly usersLoading = signal(this.canReadUsers);
  readonly usersError = signal(false);
  readonly totalUsers = signal(0);

  // ─── Interfaces state ────────────────────────────────────────
  readonly interfacesLoading = signal(this.canReadInterfaces);
  readonly interfacesError = signal(false);
  readonly totalInterfaces = signal(0);
  readonly interfacesWithError = signal(0);

  // ─── Freshness (RF-8) ────────────────────────────────────────
  /** Instant (epoch ms) of the last completed load. */
  readonly lastUpdated = signal<number | null>(null);
  private readonly now = signal(Date.now());
  /** Whole minutes elapsed since the last load (0 = just now). */
  readonly minutesSinceUpdate = computed(() => {
    const updated = this.lastUpdated();
    return updated === null ? null : Math.max(0, Math.floor((this.now() - updated) / 60_000));
  });

  /** Master node uptime formatted as "Xd Yh Zm", or null when unknown. */
  readonly uptime = computed(() => {
    const startedAt = this.masterStartedAt();
    if (!startedAt) {
      return null;
    }
    const totalMinutes = Math.max(0, Math.floor((this.now() - new Date(startedAt).getTime()) / 60_000));
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    return `${days}d ${hours}h ${minutes}m`;
  });

  /** Whether any health exception (degraded nodes or interfaces in error) is active. */
  readonly hasHealthException = computed(
    () => (!this.nodesLoading() && !this.nodesError() && this.totalNodes() > 0 && !this.allNodesOperational())
      || (!this.interfacesLoading() && !this.interfacesError() && this.interfacesWithError() > 0),
  );

  ngOnInit(): void {
    const timer = setInterval(() => this.now.set(Date.now()), FRESHNESS_TICK_MS);
    this.destroyRef.onDestroy(() => clearInterval(timer));
    this.reload();
  }

  private hasAny(...actions: string[]): boolean {
    return actions.some((action) => this.authService.hasAction(action));
  }

  /** Reloads every block independently and refreshes the freshness mark. */
  reload(): void {
    if (this.canReadNodes) {
      this.loadClusterNodes();
    }
    if (this.canReadUsers) {
      this.loadUsers();
    }
    if (this.canReadInterfaces) {
      this.loadInterfaces();
    }
  }

  private markUpdated(): void {
    const instant = Date.now();
    this.now.set(instant);
    this.lastUpdated.set(instant);
  }

  private loadClusterNodes(): void {
    this.nodesLoading.set(true);
    this.nodesError.set(false);

    this.clusterService.findAllNodes().subscribe({
      next: (nodes) => {
        this.totalNodes.set(nodes.length);
        this.activeNodes.set(nodes.filter((n) => n.status === 'ACTIVE').length);
        const master = nodes.find((n) => n.master);
        this.masterNode.set(master?.hostname ?? null);
        this.masterStartedAt.set(master?.startedAt ?? null);
        this.nodesLoading.set(false);
        this.markUpdated();
      },
      error: () => {
        this.nodesError.set(true);
        this.nodesLoading.set(false);
      },
    });
  }

  private loadUsers(): void {
    this.usersLoading.set(true);
    this.usersError.set(false);

    this.userService.countByCriteria({}).subscribe({
      next: (total) => {
        this.totalUsers.set(total);
        this.usersLoading.set(false);
        this.markUpdated();
      },
      error: () => {
        this.usersError.set(true);
        this.usersLoading.set(false);
      },
    });
  }

  private loadInterfaces(): void {
    this.interfacesLoading.set(true);
    this.interfacesError.set(false);

    this.interfaceService.findAllConfigurations().subscribe({
      next: (configs) => {
        this.totalInterfaces.set(configs.length);
        this.interfacesWithError.set(configs.filter((c) => c.status === 'ERROR').length);
        this.interfacesLoading.set(false);
        this.markUpdated();
      },
      error: () => {
        this.interfacesError.set(true);
        this.interfacesLoading.set(false);
      },
    });
  }
}
