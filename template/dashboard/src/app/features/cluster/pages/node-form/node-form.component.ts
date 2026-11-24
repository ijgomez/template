import { Component, ChangeDetectionStrategy, computed, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, of, switchMap, tap, timeout } from 'rxjs';

import { LocalDatePipe } from '../../../../shared/pipes/local-date.pipe';
import { ClusterNode } from '../../../../core/models/cluster.model';
import { ClusterService } from '../../../../core/services/cluster.service';
import { NodeJobsComponent } from '../../components/node-jobs/node-jobs.component';
import {
  NO_VALUE,
  formatFreePercent,
  formatGb,
  formatInteger,
} from '../../../../shared/utils/format.util';

/** Formats a property map as sorted "key = value" lines (empty string when there are none). */
function toPropertyText(properties: Record<string, string> | null | undefined): string {
  return Object.entries(properties ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key} = ${value}`)
    .join('\n');
}

/** Timeout (ms) for loading the node detail. */
const DETAIL_TIMEOUT_MS = 30000;

/**
 * Node form component.
 * Shows the cluster node attributes always in read-only mode (Req 25.11)
 * and lets the user manage the jobs (ClusterJob) assigned to the node.
 * The extended info (resources, JVM and environment properties) is loaded
 * from the node detail endpoint.
 */
@Component({
  selector: 'app-node-form',
  standalone: true,
  imports: [TranslatePipe, LocalDatePipe, NodeJobsComponent],
  templateUrl: './node-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodeFormComponent {
  private readonly clusterService = inject(ClusterService);

  /** The cluster node to display (always read-only). */
  readonly node = input.required<ClusterNode>();

  /** Emitted when the user clicks the back button. */
  readonly back = output<void>();

  /** Node detail loaded from the API (null while loading or on error). */
  readonly detail = signal<ClusterNode | null>(null);
  readonly loadState = signal<'loading' | 'loaded' | 'error'>('loading');

  readonly noValue = NO_VALUE;

  readonly usedMemoryGb = computed(() => this.withGbSuffix(formatGb(this.node().usedMemory)));
  readonly totalMemoryGb = computed(() => this.withGbSuffix(formatGb(this.node().totalMemory)));
  readonly freeMemoryPercent = computed(() => {
    const { totalMemory, usedMemory } = this.node();
    const percent = formatFreePercent(totalMemory, totalMemory - usedMemory);
    return percent === NO_VALUE ? percent : `${percent}%`;
  });

  readonly processors = computed(() => formatInteger(this.detail()?.processors));
  readonly filesystem = computed(() => this.detail()?.filesystem || NO_VALUE);
  readonly fsTotalGb = computed(() => formatGb(this.detail()?.fsTotalSpace));
  readonly fsFreeGb = computed(() => formatGb(this.detail()?.fsFreeSpace));
  readonly fsFreePercent = computed(() =>
    formatFreePercent(this.detail()?.fsTotalSpace, this.detail()?.fsFreeSpace));

  readonly jvmText = computed(() => toPropertyText(this.detail()?.jvmProperties));
  readonly envText = computed(() => toPropertyText(this.detail()?.environmentProperties));

  constructor() {
    toObservable(this.node)
      .pipe(
        tap(() => {
          this.detail.set(null);
          this.loadState.set('loading');
        }),
        switchMap((n) =>
          this.clusterService.findNodeById(n.id).pipe(
            timeout(DETAIL_TIMEOUT_MS),
            tap((d) => {
              this.detail.set(d);
              this.loadState.set('loaded');
            }),
            catchError(() => {
              this.detail.set(null);
              this.loadState.set('error');
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe();
  }


  private withGbSuffix(value: string): string {
    return value === NO_VALUE ? value : `${value} GB`;
  }

  onBack(): void {
    this.back.emit();
  }
}
