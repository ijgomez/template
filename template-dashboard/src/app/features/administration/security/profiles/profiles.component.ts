import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ProfileService } from '../../../../core/services/profile.service';
import { LocalDatePipe } from '../../../../shared/pipes/local-date.pipe';
import { Action, Profile, ProfileCriteria } from './models/profile.model';

type ViewMode = 'list' | 'detail' | 'form';

/**
 * Profiles management component.
 * Provides list (paginated, filterable, CSV export), create/edit form,
 * and detail views for security profiles.
 */
@Component({
  selector: 'app-profiles',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, LocalDatePipe],
  templateUrl: './profiles.component.html',
  styleUrls: ['./profiles.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilesComponent implements OnInit {
  private readonly profileService = inject(ProfileService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  // View state
  readonly viewMode = signal<ViewMode>('list');
  readonly isEditing = signal(false);
  readonly isLoading = signal(false);
  readonly showDeleteConfirm = signal(false);

  // List data
  readonly profiles = signal<Profile[]>([]);
  readonly totalElements = signal(0);
  readonly currentPage = signal(0);
  readonly pageSize = signal(10);
  readonly totalPages = computed(() => Math.ceil(this.totalElements() / this.pageSize()));

  // Filter
  readonly filterName = signal('');

  // Row selection
  readonly selectedRow = signal<Profile | null>(null);

  // Page size options
  readonly pageSizes = [5, 10, 20, 50];

  // Pagination info computeds
  readonly showingFrom = computed(() => this.currentPage() * this.pageSize() + 1);
  readonly showingTo = computed(() => Math.min((this.currentPage() + 1) * this.pageSize(), this.totalElements()));

  // Detail/Form data
  readonly selectedProfile = signal<Profile | null>(null);
  readonly formProfile = signal<Profile>({ id: null, name: '', description: '', actions: [] });
  readonly availableActions = signal<Action[]>([]);
  readonly selectedActionIds = signal<number[]>([]);

  // Form: action filter & filtered list
  readonly actionFilter = signal('');
  readonly assignedActionsFiltered = computed(() => {
    const ids = this.selectedActionIds();
    const filter = this.actionFilter().toLowerCase();
    return this.availableActions()
      .filter((a) => ids.includes(a.id))
      .filter((a) => !filter || a.code.toLowerCase().includes(filter) || a.name.toLowerCase().includes(filter));
  });

  // Action-based permissions
  readonly canWrite = computed(() => this.authService.hasAction('PROFILE_WRITE'));

  // Expose Math for template usage
  protected readonly Math = Math;

  ngOnInit(): void {
    this.loadProfiles();
    this.loadActions();
  }

  // ─── List View ──────────────────────────────────────────────

  loadProfiles(): void {
    this.isLoading.set(true);
    const criteria: ProfileCriteria = {};
    if (this.filterName()) {
      criteria.name = this.filterName();
    }

    this.profileService.findByCriteria(criteria, this.currentPage(), this.pageSize()).subscribe({
      next: (page) => {
        this.profiles.set(page.content);
        this.totalElements.set(page.totalElements);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.notificationService.showError('notification.error');
      },
    });
  }

  applyFilter(): void {
    this.currentPage.set(0);
    this.loadProfiles();
  }

  clearFilter(): void {
    this.filterName.set('');
    this.currentPage.set(0);
    this.loadProfiles();
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.loadProfiles();
    }
  }

  previousPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }

  exportCsv(): void {
    const headers = ['ID', 'Name', 'Description', 'Actions', 'Created At', 'Last Modified At'];
    const rows = this.profiles().map((p) => [
      p.id?.toString() ?? '',
      p.name,
      p.description ?? '',
      p.actions.map((a) => a.code).join('; '),
      p.createdAt ?? '',
      p.lastModifiedAt ?? '',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((field) => `"${field.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'profiles.csv';
    link.click();
    URL.revokeObjectURL(url);

    this.notificationService.showSuccess('notification.export.success');
  }

  // ─── Row Selection ────────────────────────────────────────────

  selectRow(profile: Profile): void {
    this.selectedRow.set(this.selectedRow()?.id === profile.id ? null : profile);
  }

  editSelectedProfile(): void {
    const row = this.selectedRow();
    if (row) {
      this.openEditForm(row);
    }
  }

  deleteSelectedProfile(): void {
    const row = this.selectedRow();
    if (row) {
      this.confirmDelete(row);
    }
  }

  changePageSize(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(0);
    this.loadProfiles();
  }

  // ─── Detail View ────────────────────────────────────────────

  viewDetail(profile: Profile): void {
    this.selectedProfile.set(profile);
    this.viewMode.set('detail');
  }

  // ─── Form View ──────────────────────────────────────────────

  openCreateForm(): void {
    this.formProfile.set({ id: null, name: '', description: '', actions: [] });
    this.selectedActionIds.set([]);
    this.isEditing.set(false);
    this.viewMode.set('form');
  }

  openEditForm(profile: Profile): void {
    this.formProfile.set({ ...profile });
    this.selectedActionIds.set(profile.actions.map((a) => a.id));
    this.isEditing.set(true);
    this.viewMode.set('form');
  }

  toggleAction(actionId: number): void {
    const current = this.selectedActionIds();
    if (current.includes(actionId)) {
      this.selectedActionIds.set(current.filter((id) => id !== actionId));
    } else {
      this.selectedActionIds.set([...current, actionId]);
    }
  }

  isActionSelected(actionId: number): boolean {
    return this.selectedActionIds().includes(actionId);
  }

  removeAction(actionId: number): void {
    this.toggleAction(actionId);
  }

  openActionModal(): void {
    // TODO: implement action selection modal
  }

  saveProfile(): void {
    const profile = this.formProfile();
    const actions = this.availableActions().filter((a) => this.selectedActionIds().includes(a.id));
    const payload: Profile = { ...profile, actions };

    const progressId = this.notificationService.showProgress(
      this.isEditing() ? 'notification.update.progress' : 'notification.create.progress'
    );

    const operation = this.isEditing()
      ? this.profileService.update(profile.id!, payload)
      : this.profileService.create(payload);

    operation.subscribe({
      next: () => {
        this.notificationService.updateToSuccess(
          progressId,
          this.isEditing() ? 'notification.update.success' : 'notification.create.success'
        );
        this.backToList();
      },
      error: () => {
        this.notificationService.updateToError(
          progressId,
          this.isEditing() ? 'notification.update.error' : 'notification.create.error'
        );
      },
    });
  }

  // ─── Delete ─────────────────────────────────────────────────

  confirmDelete(profile: Profile): void {
    this.selectedProfile.set(profile);
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
    this.selectedProfile.set(null);
  }

  executeDelete(): void {
    const profile = this.selectedProfile();
    if (!profile?.id) return;

    const progressId = this.notificationService.showProgress('notification.delete.progress');

    this.profileService.delete(profile.id).subscribe({
      next: () => {
        this.notificationService.updateToSuccess(progressId, 'notification.delete.success');
        this.showDeleteConfirm.set(false);
        this.selectedProfile.set(null);
        this.loadProfiles();
      },
      error: () => {
        this.notificationService.updateToError(progressId, 'notification.delete.error');
        this.showDeleteConfirm.set(false);
      },
    });
  }

  // ─── Navigation ─────────────────────────────────────────────

  backToList(): void {
    this.viewMode.set('list');
    this.selectedProfile.set(null);
    this.loadProfiles();
  }

  // ─── Helpers ────────────────────────────────────────────────

  private loadActions(): void {
    this.profileService.findAllActions().subscribe({
      next: (page) => {
        this.availableActions.set(page.content);
      },
      error: () => {
        this.notificationService.showError('notification.error');
      },
    });
  }

  /**
   * Returns visible page numbers for pagination.
   */
  getVisiblePages(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    const start = Math.max(0, current - 2);
    const end = Math.min(total - 1, current + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  /**
   * Returns the Bootstrap badge CSS class for a given action type.
   */
  getActionTypeBadgeClass(type: string): string {
    switch (type?.toUpperCase()) {
      case 'READ':
        return 'text-bg-info';
      case 'WRITE':
        return 'text-bg-success';
      case 'DELETE':
        return 'text-bg-danger';
      case 'ADMIN':
        return 'text-bg-warning';
      default:
        return 'text-bg-secondary';
    }
  }
}
