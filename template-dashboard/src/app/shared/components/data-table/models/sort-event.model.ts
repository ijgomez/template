/**
 * Sort direction for a column.
 */
export type SortDirection = 'asc' | 'desc' | '';

/**
 * Event emitted when the user changes the sort state of the table.
 */
export interface SortEvent {
  /** Column key that is being sorted. */
  column: string;

  /** Direction of the sort. Empty string means no sort applied. */
  direction: SortDirection;
}
