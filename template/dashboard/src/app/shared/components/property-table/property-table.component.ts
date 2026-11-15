import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { filterRows, toSortedRows } from './property-table.util';

/**
 * Read-only key/value table with a text filter.
 *
 * `testId` is the prefix for `data-testid` and element ids
 * (`-section`, `-heading`, `-filter`, `-table`, `-row`, `-no-matches`, `-empty`).
 * Each instance keeps its own filter state.
 */
@Component({
  selector: 'tp-property-table',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './property-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyTableComponent {
  readonly properties = input.required<Record<string, string> | null | undefined>();
  /** i18n key of the section heading. */
  readonly heading = input.required<string>();
  /** i18n key of the filter label. */
  readonly filterLabel = input.required<string>();
  readonly testId = input.required<string>();

  readonly filter = signal('');

  readonly allRows = computed(() => toSortedRows(this.properties()));
  readonly rows = computed(() => filterRows(this.allRows(), this.filter()));

  onFilter(event: Event): void {
    this.filter.set((event.target as HTMLInputElement).value);
  }
}
