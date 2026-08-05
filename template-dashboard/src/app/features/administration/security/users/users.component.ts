import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { UserService } from '../../../../core/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CsvExportService } from '../../../../core/services/csv-export.service';
import { LocalDatePipe } from '../../../../shared/pipes/local-date.pipe';
import { TpDataTableComponent, TpColumnDirective, ColumnDef } from '../../../../shared/components/data-table';
import { UserDTO, UserCriteria, ProfileRef, ReportRef } from '../../../../core/models/user.model';

type ViewMode = 'list' | 'detail' | 'create' | 'edit';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, LocalDatePipe, TpDataTableComponent, TpColumnDirective],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly csvExportService = inject(CsvExportService);
  private readonly translateService = inject(TranslateService);

  // View state
  readonly viewMode = signal<ViewMode>('list');
  readonly isLoading = signal(false);

  // List state
  readonly users = signal<UserDTO[]>([]);
  readonly totalElements = signal(0);
  readonly totalPages = signal(0);
  readonly currentPage = signal(0);
  readonly pageSize = signal(10);

  // Table columns
  readonly columns: ColumnDef[] = [
    { key: 'username', header: 'users.fields.username' },
    { key: 'firstName', header: 'users.fields.firstName' },
    { key: 'lastName', header: 'users.fields.lastName' },
    { key: 'email', header: 'users.fields.email' },
    { key: 'profileName', header: 'users.fields.profile' },
    { key: 'lastAccess', header: 'users.fields.lastAccess' },
  ];

  // Filter state
  readonly criteria = signal<UserCriteria>({});
  filterUsername = '';
  filterFirstName = '';
  filterProfileId: number | null = null;

  // Detail / Form state
  readonly selectedUser = signal<UserDTO | null>(null);
  readonly selectedRow = signal<UserDTO | null>(null);
  readonly formUser = signal<UserDTO>(this.emptyUser());

  // Reference data
  readonly profiles = signal<ProfileRef[]>([]);
  readonly reports = signal<ReportRef[]>([]);

  // Permissions
  readonly canWrite = computed(() => this.authService.hasAction('USER_WRITE'));

  // Delete confirmation
  readonly showDeleteConfirm = signal(false);
  readonly userToDelete = signal<UserDTO | null>(null);

  // Report filter (create/edit form)
  readonly reportFilter = signal('');
  readonly assignedReportsFiltered = computed(() => {
    const ids = this.formUser().reportIds;
    const allReports = this.reports();
    const filter = this.reportFilter().toLowerCase();
    return allReports
      .filter(r => ids.includes(r.id))
      .filter(r => !filter || r.name.toLowerCase().includes(filter));
  });

  ngOnInit(): void {
    this.loadUsers();
    this.loadProfiles();
    this.loadReports();
  }

  // ─── List Actions ──────────────────────────────────────────

  loadUsers(): void {
    this.isLoading.set(true);
    this.userService.findByCriteria(this.criteria(), this.currentPage(), this.pageSize()).subscribe({
      next: (page) => {
        this.users.set(page.content);
        this.totalElements.set(page.totalElements);
        this.totalPages.set(page.totalPages);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Loads users with a progress notification shown during the operation.
   * Used for user-initiated actions like pagination and filtering.
   */
  private loadUsersWithProgress(): void {
    this.isLoading.set(true);
    const notifId = this.notificationService.showProgress('notification.pagination.progress');
    this.userService.findByCriteria(this.criteria(), this.currentPage(), this.pageSize()).subscribe({
      next: (page) => {
        this.users.set(page.content);
        this.totalElements.set(page.totalElements);
        this.totalPages.set(page.totalPages);
        this.isLoading.set(false);
        this.notificationService.dismiss(notifId);
      },
      error: () => {
        this.isLoading.set(false);
        this.notificationService.updateToError(notifId, 'notification.error');
      },
    });
  }

  applyFilters(): void {
    this.criteria.set({
      username: this.filterUsername || undefined,
      firstName: this.filterFirstName || undefined,
      profileId: this.filterProfileId ?? undefined,
    });
    this.currentPage.set(0);
    this.loadUsersWithProgress();
  }

  clearFilters(): void {
    this.filterUsername = '';
    this.filterFirstName = '';
    this.filterProfileId = null;
    this.criteria.set({});
    this.currentPage.set(0);
    this.loadUsersWithProgress();
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.loadUsersWithProgress();
    }
  }

  changePageSize(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(0);
    this.loadUsersWithProgress();
  }

  selectRow(user: UserDTO): void {
    this.selectedRow.set(this.selectedRow()?.id === user.id ? null : user);
  }

  editSelectedUser(): void {
    const user = this.selectedRow();
    if (user) {
      this.showEditForm(user);
    }
  }

  deleteSelectedUser(): void {
    const user = this.selectedRow();
    if (user) {
      this.confirmDelete(user);
    }
  }

  exportCsv(): void {
    const data = this.users();
    if (data.length === 0) {
      return;
    }

    const notifId = this.notificationService.showProgress('notification.export.progress');

    const headers = [
      this.translateService.instant('users.fields.username'),
      this.translateService.instant('users.fields.firstName'),
      this.translateService.instant('users.fields.lastName'),
      this.translateService.instant('users.fields.email'),
      this.translateService.instant('users.fields.profile'),
      this.translateService.instant('users.fields.lastAccess'),
    ];

    const rows = data.map(u => [
      u.username,
      u.firstName ?? '',
      u.lastName ?? '',
      u.email ?? '',
      u.profileName ?? '',
      u.lastAccess ?? '',
    ]);

    this.csvExportService.export(headers, rows, 'users');
    this.notificationService.updateToSuccess(notifId, 'notification.export.success');
  }

  // ─── Navigation ────────────────────────────────────────────

  showDetail(user: UserDTO): void {
    this.selectedUser.set(user);
    this.viewMode.set('detail');
  }

  showCreateForm(): void {
    this.formUser.set(this.emptyUser());
    this.viewMode.set('create');
  }

  showEditForm(user: UserDTO): void {
    this.formUser.set({ ...user });
    this.viewMode.set('edit');
  }

  backToList(): void {
    this.viewMode.set('list');
    this.selectedUser.set(null);
  }

  // ─── CRUD Actions ──────────────────────────────────────────

  saveUser(): void {
    const user = this.formUser();
    if (this.viewMode() === 'create') {
      const notifId = this.notificationService.showProgress('notification.create.progress');
      this.userService.create(user).subscribe({
        next: () => {
          this.notificationService.updateToSuccess(notifId, 'notification.create.success');
          this.backToList();
          this.loadUsers();
        },
        error: () => {
          this.notificationService.updateToError(notifId, 'notification.create.error');
        },
      });
    } else {
      const notifId = this.notificationService.showProgress('notification.update.progress');
      this.userService.update(user.id!, user).subscribe({
        next: () => {
          this.notificationService.updateToSuccess(notifId, 'notification.update.success');
          this.backToList();
          this.loadUsers();
        },
        error: () => {
          this.notificationService.updateToError(notifId, 'notification.update.error');
        },
      });
    }
  }

  confirmDelete(user: UserDTO): void {
    this.userToDelete.set(user);
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
    this.userToDelete.set(null);
  }

  executeDelete(): void {
    const user = this.userToDelete();
    if (!user?.id) {
      return;
    }
    this.showDeleteConfirm.set(false);
    const notifId = this.notificationService.showProgress('notification.delete.progress');
    this.userService.delete(user.id).subscribe({
      next: () => {
        this.notificationService.updateToSuccess(notifId, 'notification.delete.success');
        this.userToDelete.set(null);
        this.loadUsers();
      },
      error: () => {
        this.notificationService.updateToError(notifId, 'notification.delete.error');
        this.userToDelete.set(null);
      },
    });
  }

  // ─── Form Helpers ──────────────────────────────────────────

  updateFormField(field: keyof UserDTO, value: unknown): void {
    this.formUser.update(u => ({ ...u, [field]: value }));
  }

  updateFormReports(reportId: number, checked: boolean): void {
    this.formUser.update(u => {
      const currentIds = [...u.reportIds];
      if (checked && !currentIds.includes(reportId)) {
        currentIds.push(reportId);
      } else if (!checked) {
        const index = currentIds.indexOf(reportId);
        if (index > -1) {
          currentIds.splice(index, 1);
        }
      }
      return { ...u, reportIds: currentIds };
    });
  }

  isReportSelected(reportId: number): boolean {
    return this.formUser().reportIds.includes(reportId);
  }

  removeReport(reportId: number): void {
    this.updateFormReports(reportId, false);
  }

  openReportModal(): void {
    // TODO: implement report selection modal
  }

  // ─── Private ───────────────────────────────────────────────

  private loadProfiles(): void {
    this.userService.getProfiles().subscribe({
      next: (page) => this.profiles.set(page.content),
      error: () => {},
    });
  }

  private loadReports(): void {
    this.userService.getReports().subscribe({
      next: (reports) => this.reports.set(reports),
      error: () => {},
    });
  }

  private emptyUser(): UserDTO {
    return {
      id: null,
      username: '',
      password: '',
      firstName: null,
      lastName: null,
      email: null,
      profileId: null,
      reportIds: [],
      lastAccess: null,
      createdAt: null,
      lastModifiedAt: null,
    };
  }
}
