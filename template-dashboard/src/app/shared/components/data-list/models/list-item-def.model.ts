/**
 * Definition of a visible field for items in the TpDataList component.
 *
 * Each definition maps a property key in the data object to a display label
 * and optional styling/formatting configuration.
 */
export interface ListItemDef {
  /** Unique key identifying the field (matches the property name in the data object). */
  key: string;

  /** Translation key for the field label (used as aria or header context). */
  label: string;

  /** CSS class(es) applied to the field value element. */
  cssClass?: string;

  /** Whether this field is the primary display field (shown prominently). */
  primary?: boolean;
}
