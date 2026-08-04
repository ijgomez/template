import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

interface ActivityEntry {
  date: string;
  user: string;
  operation: string;
  badgeClass: string;
  section: string;
}

/**
 * Dashboard component.
 * Displays system overview: stats cards, recent activity, system status, and quick links.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  readonly lastAccess = '04/08/2026 19:15';

  readonly recentActivity: ActivityEntry[] = [
    { date: '04/08/2026 19:14', user: 'admin', operation: 'CREATE', badgeClass: 'bg-success-subtle text-success', section: 'SECURITY' },
    { date: '04/08/2026 19:10', user: 'admin', operation: 'UPDATE', badgeClass: 'bg-primary-subtle text-primary', section: 'SYSTEM' },
    { date: '04/08/2026 18:55', user: 'admin', operation: 'DELETE', badgeClass: 'bg-danger-subtle text-danger', section: 'SECURITY' },
    { date: '04/08/2026 18:42', user: 'admin', operation: 'EXECUTE', badgeClass: 'bg-info-subtle text-info', section: 'REPORTS' },
    { date: '04/08/2026 18:30', user: 'system', operation: 'UPDATE', badgeClass: 'bg-primary-subtle text-primary', section: 'CLUSTER' },
  ];
}
