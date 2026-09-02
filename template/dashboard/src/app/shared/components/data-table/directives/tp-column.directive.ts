import { Directive, Input, TemplateRef } from '@angular/core';

/**
 * Structural directive to define a custom cell template for a specific column.
 *
 * Usage:
 * ```html
 * <ng-template tpColumn="profileName" let-item>
 *   <span class="badge">{{ item.profileName }}</span>
 * </ng-template>
 * ```
 */
@Directive({
  selector: '[tpColumn]',
  standalone: true,
})
export class TpColumnDirective {
  @Input({ required: true }) tpColumn!: string;

  constructor(public readonly templateRef: TemplateRef<unknown>) {}
}
