import { Directive, HostListener, inject } from '@angular/core';
import { NgForm } from '@angular/forms';

/**
 * Warns the user before closing or reloading the page while the host form has unsaved changes.
 * Usage: <form #f="ngForm" tpUnsavedChanges>.
 */
@Directive({
  selector: 'form[tpUnsavedChanges]',
})
export class UnsavedChangesDirective {
  private readonly form = inject(NgForm, { optional: true });

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.form?.dirty && !this.form.submitted) {
      event.preventDefault();
      event.returnValue = '';
    }
  }
}