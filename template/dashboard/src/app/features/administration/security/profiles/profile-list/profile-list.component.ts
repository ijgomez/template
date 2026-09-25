import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AuthService } from '../../../../../core/services/auth.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { CsvExportService } from '../../../../../core/services/csv-export.service';
import { DateService } from '../../../../../core/services/date.service';
import { ProfileService } from '../../../../../core/services/profile.service';
import { LocalDatePipe } from '../../../../../shared/pipes/local-date.pipe';
import { TpDataTableComponent, TpColumnDirective, ColumnDef, SortEvent, SortDirection } from '../../../../../shared/components/data-table';
import { Profile, ProfileCriteria } from '../models/profile.model';
import { ProfileFormComponent } from '../profile-form/profile-form.component';

type ViewMode = 'list' | 'detail' | 'create' | 'edit';

/**
 * Profiles management component.
 * Coordinates list (paginated, filterable, CSV export), detail and form views
 * for security profiles. Detail and form views are delegated to child components.
 */
@Component({
  selector: 'app-profile-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, LocalDatePipe, TpDataTableComponent, TpColumnDirective, ProfileFormComponent],
  templateUrl: './profile-list.component.html',
  styleUrls: ['./profile-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileListComponent implements OnInit {
  private readonly profileService = inject(ProfileService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly csvExportService = inject(CsvExportService);
  private readonly translateService = inject(TranslateService);
  private readonly dateService = inject(DateService);

  // View state
  readonly viewMode = signal<ViewMode>('list');
  readonly isLoading = signal(false);

  // List data
  readonly profiles = signal<Profile[]>([]);
  readonly totalElements = signal(0);
  readonly currentPage = signal(0);
  readonly pageSize = signal(10);
  readonly totalPages = computed(() => Math.ceil(this.totalElements() / this.pageSize()));

  // Table columns
  readonly columns: ColumnDef[] = [
    { key: 'name', header: 'profiles.fields.name', sortable: true, resizable: true, reorderable: true },
    { key: 'description', header: 'profiles.fields.description', sortable: true, resizable: true, reorderable: true, width: '40%' },
    { key: 'actions', header: 'profiles.fields.actions', sortable: true, resizable: true, reorderable: true, cssClass: 'text-center' },
    { key: 'createdAt', header: 'profiles.fields.createdAt', sortable: true, resizable: true, reorderable: true },
  ];

  // Sort state
  readonly sortParam = signal('');

  // Filter
  readonly filterName = signal('');

  // Row selection
  readonly selectedRow = signal<Profile | null>(null);

  // Detail / Form state
  readonly formProfile = signal<Profile>({ id: null, name: '', description: '', actions: [] });
  readonly formActionIds = signal<number[]>([]);
  readonly formMode = signal<'create' | 'edit' | 'view'>('create');

  // Delete confirmation
  readonly showDeleteConfirm = signal(false);
  readonly profileToDelete = signal<Profile | null>(null);

  // Action-based permissions
  readonly canWrite = computed(() => this.authService.hasAction('PROFILE_WRITE'));

  ngOnInit(): void {
    this.loadProfiles();
  }

  // ─── List Actions ──────────────────────────────────────────

  loadProfiles(): void {
    this.isLoading.set(true);
    const criteria: ProfileCriteria = {};
    if (this.filterName()) {
      criteria.name = this.filterName();
    }

    this.profileService.findByCriteria(criteria, this.currentPage(), this.pageSize(), this.sortParam()).subscribe({
      next: (page) => {
        this.profiles.set(page.content);
        this.totalElements.set(page.page.totalElements);
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

  onSort(event: SortEvent): void {
    // The "actions" column shows the count of assigned actions, which is not a
    // sortable JPA property on the Profile entity. Sort it client-side over the
    // current page instead of sending an invalid sort param to the backend.
    if (event.column === 'actions') {
      this.sortActionsClientSide(event.direction);
      return;
    }

    this.sortParam.set(event.direction ? `${event.column},${event.direction}` : '');
    this.currentPage.set(0);
    this.loadProfiles();
  }

  /**
   * Sorts the currently loaded profiles by their action count on the client.
   * Used for the "actions" column, which is a computed count with no
   * server-side ordering support. A null direction restores the server order.
   */
  private sortActionsClientSide(direction: SortDirection): void {
    if (!direction) {
      this.loadProfiles();
      return;
    }

    const factor = direction === 'asc' ? 1 : -1;
    const sorted = [...this.profiles()].sort(
      (a, b) => factor * (this.actionCount(a) - this.actionCount(b))
    );
    this.profiles.set(sorted);
  }

  /** Returns the number of actions assigned to a profile. */
  private actionCount(profile: Profile): number {
    return (profile.actions ?? profile.actionIds ?? []).length;
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.loadProfiles();
    }
  }

  changePageSize(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(0);
    this.loadProfiles();
  }

  selectRow(profile: Profile): void {
    this.selectedRow.set(this.selectedRow()?.id === profile.id ? null : profile);
  }

  editSelectedProfile(): void {
    const row = this.selectedRow();
    if (row) {
      this.showEditForm(row);
    }
  }

  deleteSelectedProfile(): void {
    const row = this.selectedRow();
    if (row) {
      this.confirmDelete(row);
    }
  }

  /**
   * Exports the full filtered list to CSV, ignoring the current pagination.
   * Fetches all rows matching the active filter from the backend.
   */
  exportCsv(): void {
    const criteria: ProfileCriteria = {};
    if (this.filterName()) {
      criteria.name = this.filterName();
    }

    this.profileService.findAllByCriteria(criteria, this.sortParam()).subscribe({
      next: (data) => {
        if (data.length === 0) {
          this.notificationService.showError('notification.export.empty');
          return;
        }

        const headers = [
          this.translateService.instant('profiles.fields.name'),
          this.translateService.instant('profiles.fields.description'),
          this.translateService.instant('profiles.fields.actions'),
          this.translateService.instant('profiles.fields.createdAt'),
        ];

        const rows = data.map((p) => [
          p.name,
          p.description ?? '',
          p.actions?.map((a) => a.code).join('; ') ?? '',
          p.createdAt ? this.dateService.toLocalString(p.createdAt) : '',
        ]);

        this.csvExportService.export(headers, rows, 'profiles');
        this.notificationService.showSuccess('notification.export.success');
      },
      error: () => {
        this.notificationService.showError('notification.export.error');
      },
    });
  }

  // ─── Navigation ────────────────────────────────────────────

  showDetail(profile: Profile): void {
    this.formProfile.set({ ...profile });
    const ids = profile.actionIds ?? profile.actions?.map((a) => a.id) ?? [];
    this.formActionIds.set(ids);
    this.formMode.set('view');
    this.viewMode.set('detail');
  }

  showCreateForm(): void {
    this.formProfile.set({ id: null, name: '', description: '', actions: [] });
    this.formActionIds.set([]);
    this.formMode.set('create');
    this.viewMode.set('create');
  }

  showEditForm(profile: Profile): void {
    this.formProfile.set({ ...profile });
    const ids = profile.actionIds ?? profile.actions?.map((a) => a.id) ?? [];
    this.formActionIds.set(ids);
    this.formMode.set('edit');
    this.viewMode.set('edit');
  }

  backToList(): void {
    this.viewMode.set('list');
    this.loadProfiles();
  }

  // ─── CRUD Actions ──────────────────────────────────────────

  saveProfile(event: { profile: Profile; actionIds: number[] }): void {
    const { profile, actionIds } = event;

    const payload = {
      id: profile.id,
      name: profile.name,
      description: profile.description ?? null,
      actionIds,
    };

    const isEdit = this.formMode() === 'edit';
    const progressId = this.notificationService.showProgress(
      isEdit ? 'notification.update.progress' : 'notification.create.progress'
    );

    const operation = isEdit
      ? this.profileService.update(profile.id!, payload as any)
      : this.profileService.create(payload as any);

    operation.subscribe({
      next: () => {
        this.notificationService.updateToSuccess(
          progressId,
          isEdit ? 'notification.update.success' : 'notification.create.success'
        );
        this.backToList();
      },
      error: () => {
        this.notificationService.updateToError(
          progressId,
          isEdit ? 'notification.update.error' : 'notification.create.error'
        );
      },
    });
  }

  confirmDelete(profile: Profile): void {
    this.profileToDelete.set(profile);
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
    this.profileToDelete.set(null);
  }

  executeDelete(): void {
    const profile = this.profileToDelete();
    if (!profile?.id) return;

    this.showDeleteConfirm.set(false);
    const progressId = this.notificationService.showProgress('notification.delete.progress');

    this.profileService.delete(profile.id).subscribe({
      next: () => {
        this.notificationService.updateToSuccess(progressId, 'notification.delete.success');
        this.profileToDelete.set(null);
        this.loadProfiles();
      },
      error: () => {
        this.notificationService.updateToError(progressId, 'notification.delete.error');
        this.profileToDelete.set(null);
      },
    });
  }
}
