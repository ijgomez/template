import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, computed, effect, ElementRef, inject, input, output, signal, viewChild, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { catchError, take } from 'rxjs/operators';

import { LocalDatePipe } from '../../../../shared/pipes/local-date.pipe';
import { TpSelectedActionsComponent } from '../../components/selected-actions';
import { Profile } from '../../models/profile.model';
import { ProfileService } from '../../../../core/services/profile.service';

type FormMode = 'create' | 'edit' | 'view';

/**
 * Profile form component.
 * Handles creation, edition, and read-only viewing of a profile.
 */
@Component({
  selector: 'app-profile-form',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, LocalDatePipe, TpSelectedActionsComponent],
  templateUrl: './profile-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileFormComponent implements OnInit {
  private readonly translateService = inject(TranslateService);
  private readonly profileService = inject(ProfileService);

  /** The mode of the form: 'create', 'edit', or 'view'. */
  readonly mode = input.required<FormMode>();

  /** The initial profile data to populate the form. */
  readonly profile = input.required<Profile>();

  /** The initial action IDs assigned to the profile. */
  readonly actionIds = input.required<number[]>();

  /** Whether the current user has write permissions (used in view mode). */
  readonly canWrite = input<boolean>(false);

  /** Emitted when the form is submitted with valid data. */
  readonly save = output<{ profile: Profile; actionIds: number[] }>();

  /** Emitted when the user clicks cancel or back. */
  readonly cancelled = output<void>();

  /** Emitted when the user clicks the edit button (view mode). */
  readonly edit = output<Profile>();

  /** Emitted when the user clicks the delete button (view mode). */
  readonly delete = output<Profile>();

  /** Whether the form is in readonly mode. */
  readonly isReadonly = computed(() => this.mode() === 'view');

  /** Whether the form is invalid for save in create/edit modes. */
  readonly isSaveDisabled = computed(() => {
    if (this.isReadonly()) {
      return true;
    }

    const name = this.formProfile().name?.trim() ?? '';
    return !name || this.nameExistsError() !== '';
  });

  /** Whether a save was attempted while the form was invalid (controls the error summary). */
  readonly submitAttempted = signal(false);

  /** Reference to the error summary container, used to move focus after a failed submit. */
  private readonly errorSummary = viewChild<ElementRef<HTMLElement>>('errorSummary');

  /**
   * List of validation errors for the error summary.
   * Each entry links to the invalid field via its DOM id. Only computed in edit/create modes.
   */
  readonly formErrors = computed<ReadonlyArray<{ fieldId: string; messageKey?: string; message?: string }>>(() => {
    if (this.isReadonly()) {
      return [];
    }

    const errors: { fieldId: string; messageKey?: string; message?: string }[] = [];
    if (!(this.formProfile().name?.trim())) {
      errors.push({ fieldId: 'profileName', messageKey: 'profiles.errors.nameRequired' });
    } else if (this.nameExistsError()) {
      errors.push({ fieldId: 'profileName', message: this.nameExistsError() });
    }
    return errors;
  });

  // Internal form state
  readonly formProfile = signal<Profile>({ id: null, name: '', description: '', actions: [] });
  readonly selectedActionIds = signal<number[]>([]);

  /** Error message when the name already exists in the database (empty when valid). */
  readonly nameExistsError = signal('');

  constructor() {
    effect(() => {
      const profile = this.profile();
      this.formProfile.set({ ...profile });
      this.validateNameUniqueness(profile.name ?? '');
    });

    effect(() => {
      this.selectedActionIds.set([...this.actionIds()]);
    });

    // Move focus to the error summary after a failed submit.
    effect(() => {
      if (this.submitAttempted() && this.formErrors().length > 0) {
        this.errorSummary()?.nativeElement.focus();
      }
    });
  }

  ngOnInit(): void {
    this.formProfile.set({ ...this.profile() });
    this.selectedActionIds.set([...this.actionIds()]);
  }

  updateField(field: keyof Profile, value: unknown): void {
    if (this.isReadonly()) return;
    this.formProfile.update(p => ({ ...p, [field]: value }));

    if (field === 'name') {
      this.validateNameUniqueness((value as string | null | undefined)?.trim() ?? '');
    }
  }

  onSubmit(): void {
    if (this.isReadonly()) return;

    if (this.isSaveDisabled()) {
      this.submitAttempted.set(true);
      return;
    }

    this.submitAttempted.set(false);
    this.save.emit({
      profile: this.formProfile(),
      actionIds: this.selectedActionIds(),
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onEdit(): void {
    this.edit.emit(this.profile());
  }

  onDelete(): void {
    this.delete.emit(this.profile());
  }

  /**
   * Checks against the backend whether the name is already used by another profile.
   * The criteria filter is a partial match, so the result is compared for an exact match,
   * excluding the profile being edited.
   */
  private validateNameUniqueness(name: string): void {
    const trimmed = name.trim();
    if (this.isReadonly() || !trimmed) {
      this.nameExistsError.set('');
      return;
    }

    const currentId = this.profile().id;
    this.profileService.findByCriteria({ name: trimmed }, 0, 100, 'name,asc')
      .pipe(
        catchError(() => of(null)),
        take(1)
      )
      .subscribe((page) => {
        // Discard stale responses if the user kept typing.
        if ((this.formProfile().name ?? '').trim() !== trimmed) {
          return;
        }

        const exists = !!page?.content?.some((p) => p.name === trimmed && p.id !== currentId);
        if (!exists) {
          this.nameExistsError.set('');
          return;
        }

        const messageKey = 'profiles.errors.nameExists';
        const translated = this.translateService.instant(messageKey);
        const fallback = 'Name already exists in the database';

        this.nameExistsError.set(translated && translated !== messageKey ? translated : fallback);
      });
  }

  getActionTypeBadgeClass(type: string): string {
    switch (type?.toUpperCase()) {
      case 'READ':
        return 'bg-info-subtle text-info';
      case 'WRITE':
        return 'bg-warning-subtle text-warning';
      case 'DELETE':
        return 'bg-danger-subtle text-danger';
      default:
        return 'bg-secondary-subtle text-secondary';
    }
  }
}
