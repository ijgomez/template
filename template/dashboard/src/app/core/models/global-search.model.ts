/** Tipos de entidad soportados por el buscador global. */
export type SearchEntityType = 'user' | 'parameter' | 'interface';

/** Un resultado individual, normalizado e independiente de la entidad origen. */
export interface SearchResultItem {
  type: SearchEntityType;
  id: number;
  /** Texto principal mostrado (p. ej. username, code, name). */
  primary: string;
  /** Texto secundario de contexto (p. ej. perfil, tipo, protocolo). */
  secondary?: string;
  /** Ruta de navegación al detalle. */
  route: string;
  /** Query params de deep-linking al detalle (p. ej. `{ view: 'detail', id: '3' }`). */
  queryParams: Record<string, string>;
}

/** Grupo de resultados de una misma entidad. */
export interface SearchResultGroup {
  type: SearchEntityType;
  /** Clave i18n del encabezado del grupo. */
  labelKey: string;
  items: SearchResultItem[];
  /** Total de coincidencias en backend (para decidir "Ver todos"). */
  totalMatches: number;
  /** Ruta del listado (acción "Ver todos"). */
  seeAllRoute: string;
  /** Query params para preseleccionar el filtro en el listado destino. */
  seeAllQueryParams: Record<string, string>;
  /** `true` si la búsqueda de esta entidad falló (degradación elegante, RF-5). */
  hasError?: boolean;
}
