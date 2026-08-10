import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CsvExportService } from '../../../../core/services/csv-export.service';
import { ProfileService } from '../../../../core/services/profile.service';
import { LocalDatePipe } from '../../../../shared/pipes/local-date.pipe';
import { TpDataTableComponent, TpColumnDirective, ColumnDef, SortEvent } from '../../../../shared/components/data-table';
import { TpSelectedActionsComponent } from '../../../../shared/components/selected-actions';
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
  imports: [CommonModule, FormsModule, TranslatePipe, LocalDatePipe, TpDataTableComponent, TpColumnDirective, TpSelectedActionsComponent],
  templateUrl: './profiles.component.html',
  styleUrls: ['./profiles.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilesComponent implements OnInit {
  private readonly profileService = inject(ProfileService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly csvExportService = inject(CsvExportService);
  private readonly translateService = inject(TranslateService);

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

  // Table columns
  readonly columns: ColumnDef[] = [
    { key: 'name', header: 'profiles.fields.name', sortable: true, resizable: true, reorderable: true },
    { key: 'description', header: 'profiles.fields.description', sortable: true, resizable: true, reorderable: true },
    { key: 'actions', header: 'profiles.fields.actions', cssClass: 'text-center' },
    { key: 'createdAt', header: 'profiles.fields.createdAt', sortable: true, resizable: true, reorderable: true },
  ];

  // Sort state
  readonly sortParam = signal('');

  // Filter
  readonly filterName = signal('');

  // Row selection
  readonly selectedRow = signal<Profile | null>(null);

  // Detail/Form data
  readonly selectedProfile = signal<Profile | null>(null);
  readonly formProfile = signal<Profile>({ id: null, name: '', description: '', actions: [] });
  readonly selectedActionIds = signal<number[]>([]);

  // Form: action filter & filtered list - handled by TpSelectedActionsComponent

  // Action-based permissions
  readonly canWrite = computed(() => this.authService.hasAction('PROFILE_WRITE'));

  ngOnInit(): void {
    this.loadProfiles();
  }

  // ─── List View ──────────────────────────────────────────────

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
    this.sortParam.set(event.direction ? `${event.column},${event.direction}` : '');
    this.currentPage.set(0);
    this.loadProfiles();
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

  exportCsv(): void {
    const data = this.profiles();
    if (data.length === 0) return;

    const headers = [
      this.translateService.instant('profiles.fields.name'),
      this.translateService.instant('profiles.fields.description'),
      this.translateService.instant('profiles.fields.actions'),
      this.translateService.instant('profiles.fields.createdAt'),
      this.translateService.instant('profiles.fields.lastModifiedAt'),
    ];

    const rows = data.map((p) => [
      p.name,
      p.description ?? '',
      p.actions?.map((a) => a.code).join('; ') ?? '',
      p.createdAt ?? '',
      p.lastModifiedAt ?? '',
    ]);

    this.csvExportService.export(headers, rows, 'profiles');
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
    // Support both formats: actionIds from backend DTO, or actions from enriched data
    const ids = profile.actionIds ?? profile.actions?.map((a) => a.id) ?? [];
    this.selectedActionIds.set(ids);
    this.isEditing.set(true);
    this.viewMode.set('form');
  }

  saveProfile(): void {
    const profile = this.formProfile();
    const actionIds = this.selectedActionIds();

    // Backend expects { name, description, actionIds } (ProfileDTO format)
    const payload = {
      id: profile.id,
      name: profile.name,
      description: profile.description ?? null,
      actionIds,
    };

    const progressId = this.notificationService.showProgress(
      this.isEditing() ? 'notification.update.progress' : 'notification.create.progress'
    );

    const operation = this.isEditing()
      ? this.profileService.update(profile.id!, payload as any)
      : this.profileService.create(payload as any);

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
