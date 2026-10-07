import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ReportService } from '../../core/services/report.service';
import { UserDTO } from '../../core/models/user.model';
import { UserFormComponent } from '../administration/security/users/user-form/user-form.component';
import { ProfileService } from './services/profile.service';
import { UpdateProfileRequest, UserProfile } from './models/profile.model';

/**
 * User Profile page.
 * Reuses the unified user form in read-only mode for "Mi perfil".
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [TranslatePipe, UserFormComponent],
  templateUrl: './profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  private readonly reportService = inject(ReportService);
  private readonly notificationService = inject(NotificationService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly mode = signal<'view' | 'edit'>('view');
  readonly profileUser = signal<UserDTO>(this.emptyUser());

  ngOnInit(): void {
    this.loadProfileContext();
  }

  onEdit(): void {
    this.mode.set('edit');
  }

  onBack(): void {
    this.router.navigate(['/dashboard']);
  }

  onCancel(): void {
    if (this.mode() === 'edit') {
      this.mode.set('view');
    } else {
      this.onBack();
    }
  }

  onSave(user: UserDTO): void {
    this.saving.set(true);
    const progressId = this.notificationService.showProgress('notification.update.progress');

    const payload: UpdateProfileRequest = {
      nombre: user.firstName ?? '',
      apellidos: user.lastName ?? '',
      email: user.email ?? '',
    };

    this.profileService.updateProfile(payload).subscribe({
      next: (profile) => {
        this.patchEditableFields(profile);
        this.saving.set(false);
        this.mode.set('view');
        this.notificationService.updateToSuccess(progressId, 'notification.update.success');
      },
      error: () => {
        this.saving.set(false);
        this.notificationService.updateToError(progressId, 'notification.update.error');
      },
    });
  }

  private loadProfileContext(): void {
    forkJoin({
      profile: this.profileService.getProfile(),
      reports: this.reportService.findUserReports(),
    }).subscribe({
      next: ({ profile, reports }) => {
        this.patchEditableFields(profile);
        this.profileUser.set(this.toUserDto(profile, reports.map((r) => r.id)));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.showError('profile.load.error');
      },
    });
  }

  private patchEditableFields(profile: UserProfile): void {
    this.profileUser.update((user) => ({
      ...user,
      username: profile.username,
      firstName: profile.nombre ?? null,
      lastName: profile.apellidos ?? null,
      email: profile.email ?? null,
      lastAccess: profile.lastAccess,
    }));
  }

  private toUserDto(profile: UserProfile, reportIds: number[]): UserDTO {
    return {
      id: null,
      username: profile.username,
      password: '',
      firstName: profile.nombre ?? null,
      lastName: profile.apellidos ?? null,
      email: profile.email ?? null,
      profileId: null,
      profileName: this.authService.getCurrentUser()?.profile,
      reportIds,
      lastAccess: profile.lastAccess,
      createdAt: null,
      lastModifiedAt: null,
    };
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
      profileName: undefined,
      reportIds: [],
      lastAccess: null,
      createdAt: null,
      lastModifiedAt: null,
    };
  }
}
