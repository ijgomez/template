import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { UnsavedChangesDirective } from './unsaved-changes.directive';

@Component({
  imports: [FormsModule, UnsavedChangesDirective],
  template: `<form #f="ngForm" tpUnsavedChanges><input name="a" [(ngModel)]="value" /></form>`,
})
class HostComponent {
  value = '';
}

describe('UnsavedChangesDirective', () => {
  function setup() {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture;
  }

  function fireBeforeUnload(): Event {
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    return event;
  }

  it('should not block unload when the form is pristine', () => {
    const fixture = setup();
    expect(fireBeforeUnload().defaultPrevented).toBe(false);
    fixture.destroy();
  });

  it('should block unload when the form is dirty', async () => {
    const fixture = setup();
    // NgForm registers its controls asynchronously.
    await fixture.whenStable();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = 'changed';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fireBeforeUnload().defaultPrevented).toBe(true);
    fixture.destroy();
  });
});