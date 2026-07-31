import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { UserService } from '../../../../core/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { LocalDatePipe } from '../../../../shared/pipes/local-date.pipe';
import { UserDTO, UserCriteria, ProfileRef, ReportRef } from '../../../../core/models/user.model';

type ViewMode = 'list' | 'detail' | 'create' | 'edit';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, LocalDatePipe],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
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

  // Filter state
  readonly criteria = signal<UserCriteria>({});
  filterUsername = '';
  filterFirstName = '';
  filterLastName = '';
  filterEmail = '';
  filterProfileId: number | null = null;

  // Detail / Form state
  readonly selectedUser = signal<UserDTO | null>(null);
  readonly formUser = signal<UserDTO>(this.emptyUser());

  // Reference data
  readonly profiles = signal<ProfileRef[]>([]);
  readonly reports = signal<ReportRef[]>([]);

  // Permissions
  readonly canWrite = computed(() => this.authService.hasAction('USER_WRITE'));

  // Delete confirmation
  readonly showDeleteConfirm = signal(false);
  readonly userToDelete = signal<UserDTO | null>(null);

  // Pagination computed
  readonly showingFrom = computed(() => this.currentPage() * this.pageSize() + 1);
  readonly showingTo = computed(() => Math.min((this.currentPage() + 1) * this.pageSize(), this.totalElements()));
  readonly pages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(0, current - Math.floor(maxVisible / 2));
    const end = Math.min(total, start + maxVisible);
    start = Math.max(0, end - maxVisible);
    for (let i = start; i < end; i++) {
      pages.push(i);
    }
    return pages;
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
      lastName: this.filterLastName || undefined,
      email: this.filterEmail || undefined,
      profileId: this.filterProfileId ?? undefined,
    });
    this.currentPage.set(0);
    this.loadUsersWithProgress();
  }

  clearFilters(): void {
    this.filterUsername = '';
    this.filterFirstName = '';
    this.filterLastName = '';
    this.filterEmail = '';
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

  exportCsv(): void {
    const data = this.users();
    if (data.length === 0) {
      return;
    }

    const notifId = this.notificationService.showProgress('notification.export.progress');

    const headers = ['username', 'firstName', 'lastName', 'email', 'profileName', 'lastAccess'];
    const csvRows = [
      headers.join(','),
      ...data.map(u =>
        [
          this.escapeCsv(u.username),
          this.escapeCsv(u.firstName ?? ''),
          this.escapeCsv(u.lastName ?? ''),
          this.escapeCsv(u.email ?? ''),
          this.escapeCsv(u.profileName ?? ''),
          this.escapeCsv(u.lastAccess ?? ''),
        ].join(',')
      ),
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'users.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

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

  private escapeCsv(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
