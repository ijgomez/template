# Filtros de listados (búsqueda automática)

Patrón técnico de referencia para la **barra de filtros** de las pantallas de listado del frontend. Define cómo se comportan los filtros, cómo se implementan sobre signals y cómo deben esperar los tests E2E para no volverse inestables.

Este patrón es la fuente única de verdad para los filtros de cualquier listado nuevo. La tabla, la paginación y los estados visuales se documentan en [components.md](components.md) (`tp-data-table`); este documento cubre solo la **barra de filtros** que vive en el componente de pantalla, por encima de la tabla.

---

## 1. Comportamiento esperado

- **La búsqueda se aplica automáticamente** a medida que el usuario rellena o cambia cualquier filtro. No es necesario pulsar un botón para que la tabla se actualice.
- El botón **Buscar** y el botón **Limpiar** se mantienen visibles por coherencia y accesibilidad. *Buscar* queda como acción redundante (dispara la misma consulta); *Limpiar* restablece todos los filtros a su valor por defecto.
- La búsqueda automática usa **debounce** para no lanzar una petición por cada pulsación de tecla.
- Al cambiar un filtro, la paginación se **reinicia a la página 0**.
- Si una pantalla tiene **validaciones de filtro** (p. ej. rango de fechas), la búsqueda automática las respeta: no se lanza la consulta mientras los filtros no sean válidos.

La pantalla de referencia histórica de este comportamiento es el listado de nodos del cluster (`node-list`), que filtra en cliente. El resto de listados server-side se han alineado a la misma experiencia mediante debounce.

---

## 2. Dos modos de filtrado

El modo depende de cómo se obtienen los datos del listado. **No** se mezclan.

| Modo | Cuándo se usa | Cómo reacciona al filtro |
|------|---------------|--------------------------|
| **Client-side** | El listado carga todos los registros de una vez (volumen pequeño y acotado). | Un `computed` filtra el array en memoria. Reacciona de forma inmediata, sin red ni debounce. |
| **Server-side** | El listado está paginado en el backend (`findByCriteria` con `page`, `size`, `sort`). | Al cambiar un filtro se dispara una recarga paginada, con **debounce** para agrupar pulsaciones. |

### 2.1. Client-side

Los signals de filtro alimentan un `computed` que deriva la lista visible. No hay suscripción ni debounce: el cambio del signal reevalúa el `computed` y la tabla se repinta.

```typescript
readonly filterHostname = signal('');
readonly filterStatus = signal('');

readonly filteredNodes = computed(() => {
  let nodes = this.allNodes();
  const hostname = this.filterHostname().trim().toLowerCase();
  if (hostname) {
    nodes = nodes.filter((n) => n.hostname.toLowerCase().includes(hostname));
  }
  if (this.filterStatus()) {
    nodes = nodes.filter((n) => n.status === this.filterStatus());
  }
  return nodes;
});
```

### 2.2. Server-side

Los signals de filtro se agrupan en un `computed` y se observan con `toObservable` + `debounceTime` + `distinctUntilChanged`. La suscripción llama al método que aplica filtros y recarga desde el backend.

```typescript
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, skip } from 'rxjs';

// 1) Filtros como signals
readonly filterCode = signal('');
readonly filterType = signal<ParameterType | ''>('');

// 2) Snapshot agrupado de los filtros activos
private readonly filterState = computed(() => ({
  code: this.filterCode(),
  type: this.filterType(),
}));

constructor() {
  // 3) Carga inicial (si no se hace en ngOnInit)
  this.loadParameters();

  // 4) Búsqueda automática con debounce
  toObservable(this.filterState)
    .pipe(
      skip(1),               // ignora la emisión inicial: la carga inicial ya se hizo
      debounceTime(300),     // agrupa pulsaciones (300 ms)
      distinctUntilChanged((a, b) => a.code === b.code && a.type === b.type),
      takeUntilDestroyed(),  // limpieza automática de la suscripción
    )
    .subscribe(() => this.applyFilters());
}

applyFilters(): void {
  this.currentPage.set(0);   // reinicia la paginación
  this.loadParameters();     // recarga paginada desde el backend
}
```

#### Reglas del patrón server-side

- **`skip(1)` es obligatorio**: `toObservable` emite el estado inicial de los filtros; sin `skip(1)` se dispararía una recarga duplicada justo después de la carga inicial.
- **`debounceTime(300)`**: 300 ms es el valor estándar del proyecto (coincide con el debounce del autocomplete, ver [components.md](components.md)).
- **`distinctUntilChanged`** compara campo a campo para no recargar cuando el valor efectivo no cambia.
- **`takeUntilDestroyed()`** debe invocarse en el **constructor** (contexto de inyección); por eso la suscripción se crea ahí, no en `ngOnInit`.
- Si existe validación de filtros, `applyFilters()` corta antes de la petición. Ejemplo con rango de fechas:

```typescript
readonly hasInvalidDateRange = computed(
  () => !!this.filterDateFrom() && !!this.filterDateTo() && this.filterDateFrom() > this.filterDateTo(),
);

applyFilters(): void {
  if (this.hasInvalidDateRange()) {
    return; // no se consulta con un rango inválido
  }
  this.currentPage.set(0);
  this.loadLogs();
}
```

---

## 3. Enlace en la plantilla

Los filtros se enlazan a los signals con el patrón `[ngModel]` + `(ngModelChange)` (no `[(ngModel)]` sobre propiedades planas), para que el `computed` reaccione.

```html
<div class="tp-filter-bar">
  <form class="row g-3 align-items-end" (ngSubmit)="applyFilters()" data-testid="parameters-filter-form">
    <div class="col-md-4">
      <label for="filterCode" class="form-label">{{ 'parameters.fields.code' | translate }}</label>
      <input id="filterCode" type="text" class="form-control form-control-sm"
             [ngModel]="filterCode()" (ngModelChange)="filterCode.set($event)" name="filterCode"
             data-testid="filter-code">
    </div>
    <div class="col-12 d-flex justify-content-end gap-2 mt-2">
      <button type="submit" class="btn btn-primary btn-sm" data-testid="btn-filter-search">
        {{ 'button.filter' | translate }}
      </button>
      <button type="button" class="btn btn-outline-secondary btn-sm" (click)="clearFilters()" data-testid="btn-filter-clear">
        {{ 'parameters.filters.clear' | translate }}
      </button>
    </div>
  </form>
</div>
```

El contenedor usa la clase `tp-filter-bar` (ver [layout.md](layout.md), plantilla *List Screen*).

---

## 4. Identificadores para pruebas (`data-testid`)

| Elemento | Convención |
|----------|------------|
| Formulario de filtros | `<entidad>-filter-form` |
| Campo de filtro | `filter-<campo>` o `<entidad>-filter-<campo>` |
| Botón Buscar | `btn-filter-search` (o `<entidad>-apply-filters`) |
| Botón Limpiar | `btn-filter-clear` (o `<entidad>-clear-filters`) |

Mantener la convención por pantalla; lo importante es que **todos** los elementos interactivos del filtro tengan `data-testid` (ver [angular.md](../../04-development/coding-guidelines/angular.md)).

---

## 5. Implicaciones para los tests E2E (Playwright)

La búsqueda automática introduce peticiones que pueden solaparse (la carga inicial y la del filtro). Los **Page Objects** deben esperar de forma determinista o los tests se vuelven inestables (*flaky*). Reglas obligatorias:

1. **`goto()` espera a la primera fila**, no solo a que la tabla sea visible. La tabla se vuelve visible mientras aún muestra el spinner de carga (sin filas); leer celdas o contar filas antes de que termine la carga inicial produce `0 filas` de forma intermitente.

   ```typescript
   async goto(): Promise<void> {
     await this.page.goto('/...');
     await this.table.waitFor({ state: 'visible' });
     await this.rows.first().waitFor({ state: 'visible' });
   }
   ```

2. **Las esperas de red resuelven solo con la respuesta esperada.** No basta con esperar "cualquier GET del listado": una petición previa aún en vuelo (la carga inicial que llega con retraso) satisfaría la espera antes de tiempo. Se filtra por los parámetros de URL que identifican la respuesta (`page`, o el valor del filtro aplicado: `name`, `username`, `code`, `type`...).

   ```typescript
   async searchByCode(code: string): Promise<void> {
     const response = this.waitForQuery({ code }); // espera la respuesta con ese code
     await this.filterCode.fill(code);
     await this.searchButton.click();
     await response;
   }

   private waitForQuery(match?: { code?: string; page?: number }): Promise<unknown> {
     return this.page.waitForResponse((response) => {
       const url = response.url();
       if (response.request().method() !== 'GET' || !url.includes('/administration/parameters')
           || url.includes('/count') || response.status() !== 200) {
         return false;
       }
       const params = new URL(url).searchParams;
       if (match?.code !== undefined && params.get('code') !== match.code) return false;
       if (match?.page !== undefined && params.get('page') !== String(match.page)) return false;
       return true;
     });
   }
   ```

3. **No esperar filas tras aplicar un filtro** que pueda devolver vacío (un filtro sin coincidencias es un estado legítimo). Sí esperar la primera fila tras `clearFilters()`, porque el listado completo siempre tiene datos semilla.

4. **Preferir aserciones con auto-retry** (`toContainText`, `toHaveCount`, `toBeVisible`) frente a lecturas puntuales (`allTextContents`, `count()`), que capturan un instante y son sensibles al repintado.

---

## 6. Checklist para una pantalla de listado nueva

- [ ] Decidir el modo: client-side (`computed`) o server-side (debounce). No mezclar.
- [ ] Filtros como `signal`, enlazados con `[ngModel]` + `(ngModelChange)`.
- [ ] Server-side: suscripción `toObservable(filterState)` con `skip(1)`, `debounceTime(300)`, `distinctUntilChanged` y `takeUntilDestroyed()` en el constructor.
- [ ] `applyFilters()` reinicia la paginación a 0 y respeta las validaciones de filtro.
- [ ] `data-testid` en formulario, campos y botones de filtro.
- [ ] Test de componente (`.spec.ts`) que cubra `applyFilters`/`clearFilters` y la validación si existe.
- [ ] Page Object E2E con `goto()` que espera la primera fila y esperas de red filtradas por parámetros.

---

## Documentación relacionada

- [Componentes reutilizables](components.md) — `tp-data-table`, `tp-data-list`, paginación y estados.
- [Layout de pantallas](layout.md) — plantilla *List Screen* y clase `tp-filter-bar`.
- [Guía de codificación Angular](../../04-development/coding-guidelines/angular.md).
- [Guía de testing (Playwright E2E)](../../04-development/coding-guidelines/testing.md).
