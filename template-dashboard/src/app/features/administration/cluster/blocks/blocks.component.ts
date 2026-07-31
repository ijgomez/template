import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { ClusterService } from '../../../../core/services/cluster.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { LocalDatePipe } from '../../../../shared/pipes/local-date.pipe';
import { ClusterBlock, ClusterBlockCriteria } from '../../../../core/models/cluster.model';

/**
 * Cluster blocks component.
 * Displays a paginated, filterable table of cluster blocks (read-only per Req 25.12).
 * Supports detail view and CSV export.
 */
@Component({
  selector: 'app-cluster-blocks',
  standalone: true,
  imports: [FormsModule, TranslatePipe, LocalDatePipe],
  templateUrl: './blocks.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlocksComponent implements OnInit {
  private readonly clusterService = inject(ClusterService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly translateService = inject(TranslateService);

  // View state
  readonly viewMode = signal<'list' | 'detail'>('list');
  readonly selectedBlock = signal<ClusterBlock | null>(null);

  // Pagination state
  readonly blocks = signal<ClusterBlock[]>([]);
  readonly totalElements = signal(0);
  readonly currentPage = signal(0);
  readonly pageSize = signal(10);
  readonly totalPages = computed(() => Math.ceil(this.totalElements() / this.pageSize()));
  readonly isLoading = signal(false);

  // Filter state
  readonly filterName = signal('');

  // Pagination display helpers
  readonly showingFrom = computed(() => this.totalElements() === 0 ? 0 : this.currentPage() * this.pageSize() + 1);
  readonly showingTo = computed(() => Math.min((this.currentPage() + 1) * this.pageSize(), this.totalElements()));

  ngOnInit(): void {
    this.loadBlocks();
  }

  /**
   * Loads cluster blocks from the backend with current pagination and filters.
   */
  loadBlocks(): void {
    this.isLoading.set(true);
    const criteria = this.buildCriteria();
    const progressId = this.notificationService.showProgress('notification.pagination.progress');

    this.clusterService.findBlocksByCriteria(criteria, this.currentPage(), this.pageSize()).subscribe({
      next: (page) => {
        this.blocks.set(page.content);
        this.totalElements.set(page.totalElements);
        this.isLoading.set(false);
        this.notificationService.dismiss(progressId);
      },
      error: () => {
        this.isLoading.set(false);
        this.notificationService.updateToError(progressId, 'notification.error');
      },
    });
  }

  /**
   * Applies filters and reloads the data from page 0.
   */
  applyFilters(): void {
    this.currentPage.set(0);
    this.loadBlocks();
  }

  /**
   * Clears all filters and reloads.
   */
  clearFilters(): void {
    this.filterName.set('');
    this.currentPage.set(0);
    this.loadBlocks();
  }

  /**
   * Navigates to a specific page.
   */
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.loadBlocks();
    }
  }

  /**
   * Opens the detail view for a cluster block.
   */
  viewDetail(block: ClusterBlock): void {
    this.selectedBlock.set(block);
    this.viewMode.set('detail');
  }

  /**
   * Returns to the list view.
   */
  backToList(): void {
    this.viewMode.set('list');
    this.selectedBlock.set(null);
  }

  /**
   * Exports current page data to CSV.
   */
  exportCsv(): void {
    const progressId = this.notificationService.showProgress('notification.export.progress');

    try {
      const headers = [
        this.translateService.instant('cluster.blocks.fields.name'),
        this.translateService.instant('cluster.blocks.fields.startDate'),
        this.translateService.instant('cluster.blocks.fields.avgTime'),
        this.translateService.instant('cluster.blocks.fields.minTime'),
        this.translateService.instant('cluster.blocks.fields.maxTime'),
        this.translateService.instant('cluster.blocks.fields.total'),
        this.translateService.instant('cluster.blocks.fields.createdAt'),
        this.translateService.instant('cluster.blocks.fields.lastModifiedAt'),
      ];

      const rows = this.blocks().map((block) => [
        this.escapeCsvField(block.name),
        this.escapeCsvField(block.startDate ?? ''),
        this.escapeCsvField(String(block.avgTime)),
        this.escapeCsvField(String(block.minTime)),
        this.escapeCsvField(String(block.maxTime)),
        this.escapeCsvField(String(block.total)),
        this.escapeCsvField(block.createdAt),
        this.escapeCsvField(block.lastModifiedAt),
      ]);

      const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cluster_blocks_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      this.notificationService.updateToSuccess(progressId, 'notification.export.success');
    } catch {
      this.notificationService.updateToError(progressId, 'notification.export.error');
    }
  }

  /**
   * Returns an array of page numbers for pagination display.
   */
  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    const maxVisible = 5;

    let start = Math.max(0, current - Math.floor(maxVisible / 2));
    const end = Math.min(total, start + maxVisible);

    if (end - start < maxVisible) {
      start = Math.max(0, end - maxVisible);
    }

    for (let i = start; i < end; i++) {
      pages.push(i);
    }
    return pages;
  }

  private buildCriteria(): ClusterBlockCriteria {
    const criteria: ClusterBlockCriteria = {};
    if (this.filterName()) criteria.name = this.filterName();
    return criteria;
  }

  private escapeCsvField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }
}
