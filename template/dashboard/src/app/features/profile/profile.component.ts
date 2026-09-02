import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { LocalDatePipe } from '../../shared/pipes/local-date.pipe';
import { NotificationService } from '../../core/services/notification.service';
import { ProfileService } from './services/profile.service';
import { UserProfile } from './models/profile.model';

/**
 * User Profile page — self-service profile management.
 * Displays read-only fields (username, lastAccess) and editable fields (nombre, apellidos, email).
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, LocalDatePipe],
  templateUrl: './profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly notificationService = inject(NotificationService);

  readonly loading = signal(true);
  readonly saving = signal(false);

  profileForm!: FormGroup;
  username = signal('');
  lastAccess = signal<string | null>(null);

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      apellidos: ['', [Validators.required, Validators.maxLength(200)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    });

    this.loadProfile();
  }

  /**
   * Saves profile changes via PUT /api/v1/administration/security/users/me.
   */
  save(): void {
    if (this.profileForm.invalid || this.saving()) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const progressId = this.notificationService.showProgress('notification.update.progress');

    this.profileService.updateProfile(this.profileForm.value).subscribe({
      next: (profile) => {
        this.patchForm(profile);
        this.saving.set(false);
        this.notificationService.updateToSuccess(progressId, 'notification.update.success');
      },
      error: () => {
        this.saving.set(false);
        this.notificationService.updateToError(progressId, 'notification.update.error');
      },
    });
  }

  /**
   * Checks if a form control has a validation error and has been touched.
   */
  hasError(controlName: string, errorType: string): boolean {
    const control = this.profileForm.get(controlName);
    return !!control && control.hasError(errorType) && control.touched;
  }

  private loadProfile(): void {
    this.profileService.getProfile().subscribe({
      next: (profile) => {
        this.patchForm(profile);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.showError('profile.load.error');
      },
    });
  }

  private patchForm(profile: UserProfile): void {
    this.username.set(profile.username);
    this.lastAccess.set(profile.lastAccess);
    this.profileForm.patchValue({
      nombre: profile.nombre,
      apellidos: profile.apellidos,
      email: profile.email,
    });
  }
}
