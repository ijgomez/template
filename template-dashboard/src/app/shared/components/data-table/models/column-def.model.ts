/**
 * Definition of a column for the TpDataTable component.
 */
export interface ColumnDef {
  /** Unique key identifying the column (matches the property name in the data object). */
  key: string;

  /** Translation key for the column header. */
  header: string;

  /** Whether the column is sortable. Defaults to false. */
  sortable?: boolean;

  /** Whether the column is resizable by the user. Defaults to false. */
  resizable?: boolean;

  /** Initial width of the column (CSS value, e.g. '150px', '20%'). */
  width?: string;

  /** Minimum width when resizing (in pixels). Defaults to 50. */
  minWidth?: number;

  /** Maximum width when resizing (in pixels). If not set, no maximum is enforced. */
  maxWidth?: number;

  /** CSS class(es) applied to both <th> and <td> of this column. */
  cssClass?: string;
}
