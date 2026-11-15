/** Bytes por gigabyte (GiB) usados para mostrar espacio en disco. */
export const BYTES_PER_GB = 1_073_741_824;

/** Texto mostrado cuando un valor no está disponible. */
export const NO_VALUE = '-';

function isNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Bytes a GB con 2 decimales, o '-' si no hay valor. */
export function formatGb(bytes: number | null | undefined): string {
  return isNumber(bytes) ? (bytes / BYTES_PER_GB).toFixed(2) : NO_VALUE;
}

/** Porcentaje libre con 1 decimal acotado a [0, 100]; '-' si total es nulo o 0 (o free es nulo). */
export function formatFreePercent(total: number | null | undefined, free: number | null | undefined): string {
  if (!isNumber(total) || total === 0 || !isNumber(free)) {
    return NO_VALUE;
  }
  const percent = Math.min(100, Math.max(0, (free / total) * 100));
  return percent.toFixed(1);
}

/** Entero como texto, o '-' si no hay valor. */
export function formatInteger(value: number | null | undefined): string {
  return isNumber(value) ? String(Math.trunc(value)) : NO_VALUE;
}
