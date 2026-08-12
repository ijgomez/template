import { Directive, TemplateRef } from '@angular/core';

/**
 * Structural directive to define a custom item template for the data list.
 *
 * Usage:
 * ```html
 * <tp-data-list [data]="items" ...>
 *   <ng-template tpListItem let-item>
 *     <span class="badge">{{ item.type }}</span>
 *     <span>{{ item.code }} — {{ item.name }}</span>
 *   </ng-template>
 * </tp-data-list>
 * ```
 */
@Directive({
  selector: '[tpListItem]',
  standalone: true,
})
export class TpListItemDirective {
  constructor(public readonly templateRef: TemplateRef<unknown>) {}
}
