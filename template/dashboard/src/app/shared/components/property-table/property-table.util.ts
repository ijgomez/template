export interface PropertyRow {
  key: string;
  value: string;
}

/** Convierte un mapa en filas ordenadas por clave sin distinguir mayúsculas. */
export function toSortedRows(props: Record<string, string> | null | undefined): PropertyRow[] {
  if (!props) {
    return [];
  }
  return Object.entries(props)
    .map(([key, value]) => ({ key, value: value ?? '' }))
    .sort((a, b) =>
      a.key.toLowerCase().localeCompare(b.key.toLowerCase(), undefined, { sensitivity: 'base' }));
}

/** Filtra filas cuya clave o valor contiene el texto (sin distinguir mayúsculas), conservando el orden. */
export function filterRows(rows: PropertyRow[], text: string): PropertyRow[] {
  const needle = (text ?? '').toLowerCase();
  if (!needle) {
    return rows;
  }
  return rows.filter(
    (row) => row.key.toLowerCase().includes(needle) || row.value.toLowerCase().includes(needle));
}
