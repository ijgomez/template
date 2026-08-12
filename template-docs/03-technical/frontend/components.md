# Componentes Reutilizables

## Introduccion

Los **componentes reutilizables** de Template son piezas de interfaz compartidas entre diferentes pantallas y modulos funcionales de la aplicacion.

Su objetivo es evitar la duplicacion de logica de presentacion, mantener la coherencia visual y facilitar el mantenimiento del frontend. Todos los componentes reutilizables se ubican en el modulo `shared/` y son consumidos por los distintos `features/`.

Este documento describe la especificacion funcional y tecnica de cada componente reutilizable, complementando el catalogo definido en [design-system.md](design-system.md).

---

# Objetivos

- Centralizar los componentes de interfaz que se utilizan en mas de una pantalla.
- Garantizar una implementacion unica y coherente para cada pieza visual.
- Facilitar la generacion automatica de interfaces por parte de agentes de IA.
- Reducir el coste de mantenimiento ante cambios de diseno.
- Servir como referencia para desarrolladores y herramientas de generacion.

---

# Principios

| Principio                  | Descripcion                                                                              |
|----------------------------|------------------------------------------------------------------------------------------|
| Responsabilidad Unica      | Cada componente resuelve una sola necesidad de interfaz.                                 |
| Composicion                | Los componentes complejos se construyen combinando componentes mas simples.              |
| Configuracion por Inputs   | El comportamiento se controla mediante `@Input()` y `@Output()`, sin estado global.     |
| Independencia de dominio   | Los componentes de `shared/` no conocen entidades de negocio; son genericos.             |
| Accesibilidad por defecto  | Todos los componentes incluyen atributos ARIA y soporte de teclado de fabrica.           |
| Testing integrado          | Cada componente incluye `data-testid` y su fichero `.spec.ts` correspondiente.           |

---

# Ubicacion en el proyecto

```
src/
└── app/
    └── shared/
        └── components/
            ├── button/
            │   ├── button.component.ts
            │   ├── button.component.html
            │   ├── button.component.scss
            │   └── button.component.spec.ts
            ├── data-table/
            │   ├── data-table.component.ts
            │   ├── data-table.component.html
            │   ├── data-table.component.scss
            │   ├── index.ts
            │   ├── models/
            │   │   ├── column-def.model.ts
            │   │   └── sort-event.model.ts
            │   └── directives/
            │       └── tp-column.directive.ts
            ├── data-list/
            │   ├── data-list.component.ts
            │   ├── data-list.component.html
            │   ├── data-list.component.scss
            │   ├── index.ts
            │   ├── models/
            │   │   └── list-item-def.model.ts
            │   └── directives/
            │       └── tp-list-item.directive.ts
            ├── selected-reports/
            │   ├── selected-reports.component.ts
            │   ├── selected-reports.component.html
            │   ├── selected-reports.component.scss
            │   └── index.ts
            ├── selected-actions/
            │   ├── selected-actions.component.ts
            │   ├── selected-actions.component.html
            │   ├── selected-actions.component.scss
            │   └── index.ts
            ├── modal/
            ├── card/
            ├── alert/
            ├── badge/
            ├── breadcrumb/
            ├── tabs/
            ├── spinner/
            ├── toast/
            ├── pagination/
            ├── form-group/
            ├── input/
            ├── select/
            ├── checkbox/
            ├── radio/
            ├── date-picker/
            ├── date-range/
            ├── autocomplete/
            └── entity-filter/
```

Cada componente sigue la convencion de un directorio propio con sus ficheros `.ts`, `.html`, `.scss` y `.spec.ts` separados.

---

# Catalogo de Componentes

## Boton (`tp-button`)

| Propiedad   | Tipo                                                        | Defecto     | Descripcion                        |
|-------------|-------------------------------------------------------------|-------------|------------------------------------|
| `variant`   | `'primary' \| 'secondary' \| 'danger' \| 'outline' \| 'link' \| 'icon'` | `'primary'` | Estilo visual del boton            |
| `size`      | `'sm' \| 'md' \| 'lg'`                                     | `'md'`      | Tamano del boton                   |
| `disabled`  | `boolean`                                                   | `false`     | Deshabilita la interaccion         |
| `loading`   | `boolean`                                                   | `false`     | Muestra spinner y deshabilita      |
| `type`      | `'button' \| 'submit' \| 'reset'`                           | `'button'`  | Tipo HTML del boton                |

**Eventos:**
- `(clicked)`: Emitido al pulsar el boton (no se emite si `disabled` o `loading`).

**Accesibilidad:**
- `aria-disabled` cuando `disabled=true`.
- `aria-busy` cuando `loading=true`.
- Foco visible con anillo de `2px solid var(--tp-color-primary)`.

---

## Input (`tp-input`)

| Propiedad     | Tipo                          | Defecto  | Descripcion                              |
|---------------|-------------------------------|----------|------------------------------------------|
| `type`        | `'text' \| 'number' \| 'email' \| 'password'` | `'text'` | Tipo de input HTML                       |
| `placeholder` | `string`                      | `''`     | Texto de placeholder                     |
| `size`        | `'sm' \| 'md' \| 'lg'`       | `'md'`   | Tamano del campo                         |
| `disabled`    | `boolean`                     | `false`  | Deshabilita la entrada                   |
| `readonly`    | `boolean`                     | `false`  | Solo lectura                             |

**Accesibilidad:**
- Asociado a un `<label>` mediante `aria-labelledby` o envuelto en `<tp-form-group>`.
- `aria-invalid="true"` cuando hay error de validacion.
- `aria-describedby` apuntando al mensaje de error.

---

## Select (`tp-select`)

| Propiedad   | Tipo                    | Defecto  | Descripcion                              |
|-------------|-------------------------|----------|------------------------------------------|
| `options`   | `Array<{value, label}>` | `[]`     | Lista de opciones disponibles            |
| `size`      | `'sm' \| 'md' \| 'lg'` | `'md'`   | Tamano del select                        |
| `disabled`  | `boolean`               | `false`  | Deshabilita la seleccion                 |
| `multiple`  | `boolean`               | `false`  | Permite seleccion multiple               |

---

## Checkbox (`tp-checkbox`)

| Propiedad     | Tipo      | Defecto | Descripcion                              |
|---------------|-----------|---------|------------------------------------------|
| `label`       | `string`  | `''`    | Texto asociado al checkbox               |
| `disabled`    | `boolean` | `false` | Deshabilita la interaccion               |
| `indeterminate` | `boolean` | `false` | Estado indeterminado (parcial)           |

---

## Radio (`tp-radio`)

| Propiedad  | Tipo      | Defecto | Descripcion                              |
|------------|-----------|---------|------------------------------------------|
| `label`    | `string`  | `''`    | Texto asociado al radio                  |
| `value`    | `any`     | —       | Valor que representa esta opcion         |
| `disabled` | `boolean` | `false` | Deshabilita la interaccion               |

---

## Tabla de datos (`tp-data-table`)

Componente reutilizable que encapsula una tabla con paginacion, seleccion de filas, ordenacion por columna, redimensionamiento de columnas, reordenacion por drag & drop, estados de carga/vacio y soporte para templates de celda personalizados.

**Selector:** `<tp-data-table>`

**Ubicacion:** `shared/components/data-table/`

### Inputs

| Propiedad       | Tipo                          | Defecto           | Descripcion                                |
|-----------------|-------------------------------|-------------------|--------------------------------------------|
| `columns`       | `ColumnDef[]`                 | `[]` (required)   | Definicion de columnas                     |
| `data`          | `Array<T>`                    | `[]` (required)   | Datos de la pagina actual                  |
| `loading`       | `boolean`                     | `false`           | Muestra estado de carga (spinner)          |
| `totalElements` | `number`                      | `0`               | Total de elementos (para paginacion)       |
| `currentPage`   | `number`                      | `0`               | Pagina actual (0-indexed)                  |
| `pageSize`      | `number`                      | `10`              | Elementos por pagina                       |
| `pageSizes`     | `number[]`                    | `[5, 10, 20, 50]` | Opciones de tamano de pagina              |
| `selectable`    | `boolean`                     | `true`            | Permite seleccion de filas                 |
| `selectedItem`  | `T \| null`                   | `null`            | Item seleccionado (comparado por `id`)     |
| `ariaLabel`     | `string`                      | `''`              | Label de accesibilidad para la tabla       |
| `testId`        | `string`                      | `''`              | Atributo `data-testid` de la tabla         |

### Outputs

| Evento              | Tipo                          | Descripcion                                    |
|---------------------|-------------------------------|------------------------------------------------|
| `(pageChange)`      | `EventEmitter<number>`        | Emitido al cambiar de pagina                   |
| `(pageSizeChange)`  | `EventEmitter<number>`        | Emitido al cambiar tamano de pagina            |
| `(rowSelect)`       | `EventEmitter<T>`             | Emitido al seleccionar/deseleccionar fila      |
| `(rowDoubleClick)`  | `EventEmitter<T>`             | Emitido al hacer doble clic en una fila        |
| `(sortChange)`      | `EventEmitter<SortEvent>`     | Emitido al cambiar la ordenacion               |
| `(columnResize)`    | `EventEmitter<{column, width}>` | Emitido al redimensionar una columna        |
| `(columnsReorder)`  | `EventEmitter<ColumnDef[]>`   | Emitido al reordenar columnas (drag & drop)    |

### Modelo ColumnDef

```typescript
interface ColumnDef {
  key: string;           // Clave que identifica la columna (propiedad del objeto)
  header: string;        // Clave de traduccion para la cabecera
  sortable?: boolean;    // Si la columna es ordenable (click en cabecera)
  resizable?: boolean;   // Si el usuario puede redimensionar la columna
  reorderable?: boolean; // Si la columna puede reordenarse por drag & drop
  width?: string;        // Ancho inicial (valor CSS, e.g. '150px', '20%')
  minWidth?: number;     // Ancho minimo al redimensionar (px). Defecto: 50
  maxWidth?: number;     // Ancho maximo al redimensionar (px). Sin limite por defecto
  cssClass?: string;     // Clase CSS aplicada a <th> y <td>
}
```

### Modelo SortEvent

```typescript
type SortDirection = 'asc' | 'desc' | '';

interface SortEvent {
  column: string;        // Clave de la columna ordenada
  direction: SortDirection; // Direccion del orden (vacio = sin orden)
}
```

### Ordenacion por columna

Las columnas con `sortable: true` permiten al usuario hacer clic en la cabecera para ciclar entre los estados: ascendente, descendente y sin orden.

- **Indicadores visuales**: Icono `bi-sort-up` (asc), `bi-sort-down` (desc), `bi-arrow-down-up` (sin orden).
- **Icono activo**: Color `--bs-primary` cuando la columna esta ordenada.
- **Navegacion por teclado**: `Enter` y `Space` activan el sort.
- **Accesibilidad**: `aria-sort` con valores `ascending`, `descending` o `none`.
- **Integracion backend**: El evento `(sortChange)` emite `{column, direction}`. Los componentes consumidores construyen el parametro `sort=field,direction` (formato Spring Data) y lo envian al backend.

### Redimensionamiento de columnas

Las columnas con `resizable: true` muestran un handle de arrastre en el borde derecho de la cabecera.

- **Handle visual**: Linea de 4px transparente que se ilumina en `--bs-primary` al hover.
- **Cursor**: `col-resize` durante el arrastre.
- **Limites**: Configurable via `minWidth` (defecto 50px) y `maxWidth` (sin limite).
- **Layout**: Cuando alguna columna tiene `width` o `resizable`, la tabla usa `table-layout: fixed`.
- **Evento**: `(columnResize)` emite la clave y el nuevo ancho en px.

### Reordenacion de columnas (Drag & Drop)

Las columnas con `reorderable: true` pueden arrastrarse y soltarse para cambiar el orden.

- **API**: HTML5 Drag and Drop nativo (`draggable="true"`).
- **Feedback visual**:
  - Cursor `grab`/`grabbing` en cabeceras arrastrables.
  - La columna arrastrada se muestra con opacidad reducida (0.4).
  - El destino muestra un borde izquierdo azul (`--bs-primary`) como indicador de drop.
- **Evento**: `(columnsReorder)` emite el nuevo array de `ColumnDef[]` tras soltar.
- **Compatibilidad**: No interfiere con la funcionalidad de sort (el drag solo se activa al arrastrar, no al hacer clic simple).

### Templates de celda personalizados (TpColumnDirective)

Para personalizar el renderizado de una celda, se usa la directiva `tpColumn`:

```html
<tp-data-table [columns]="columns" [data]="users()" ...>
  <ng-template tpColumn="profileName" let-user>
    <span class="badge bg-primary-subtle text-primary">{{ user.profileName }}</span>
  </ng-template>
  <ng-template tpColumn="lastAccess" let-user>
    {{ user.lastAccess | localDate }}
  </ng-template>
</tp-data-table>
```

Si no se define un template para una columna, se muestra el valor plano de `item[column.key]`.

### Estados

| Estado  | Comportamiento                                                   |
|---------|------------------------------------------------------------------|
| Carga   | Muestra `spinner-border` centrado en el tbody                    |
| Vacio   | Muestra mensaje traducido `common.noData` centrado               |
| Datos   | Renderiza las filas con seleccion visual (`table-active`)        |

### Paginacion integrada

El componente incluye un `card-footer` con:
- Contador de registros: "Mostrando X-Y de Z"
- Navegacion de paginas (maximo 5 visibles)
- Selector de elementos por pagina

### Accesibilidad

- `aria-label` configurable en la tabla.
- `aria-sort` en cabeceras ordenables (`ascending`, `descending`, `none`).
- `aria-selected` en las filas seleccionadas.
- `aria-current="page"` en la pagina activa.
- `aria-hidden="true"` en iconos decorativos (chevrons, sort icons, resize handles).
- `role="row"` en las filas de datos.
- `role="status"` en el spinner con texto oculto.
- `tabindex="0"` en cabeceras sortables para navegacion por teclado.
- Soporte de `Enter` y `Space` para activar ordenacion.

### Ejemplo de uso completo

```html
<tp-data-table
  [columns]="columns"
  [data]="users()"
  [loading]="isLoading()"
  [totalElements]="totalElements()"
  [currentPage]="currentPage()"
  [pageSize]="pageSize()"
  [selectable]="true"
  [selectedItem]="selectedRow()"
  (rowSelect)="selectRow($event)"
  (rowDoubleClick)="viewDetail($event)"
  (pageChange)="goToPage($event)"
  (pageSizeChange)="changePageSize($event)"
  (sortChange)="onSort($event)"
  (columnResize)="onResize($event)"
  (columnsReorder)="onReorder($event)"
  ariaLabel="Listado de usuarios"
  testId="users-table">

  <ng-template tpColumn="profileName" let-user>
    <span class="badge bg-primary-subtle text-primary">{{ user.profileName }}</span>
  </ng-template>

  <ng-template tpColumn="lastAccess" let-user>
    {{ user.lastAccess | localDate }}
  </ng-template>
</tp-data-table>
```

### Definicion de columnas con todas las opciones

```typescript
readonly columns: ColumnDef[] = [
  { key: 'username', header: 'users.fields.username', sortable: true, resizable: true, reorderable: true },
  { key: 'firstName', header: 'users.fields.firstName', sortable: true, resizable: true, reorderable: true },
  { key: 'email', header: 'users.fields.email', sortable: true, resizable: true, reorderable: true, width: '200px', minWidth: 100, maxWidth: 400 },
  { key: 'profileName', header: 'users.fields.profile', sortable: true, resizable: true, reorderable: true },
  { key: 'lastAccess', header: 'users.fields.lastAccess', sortable: true, resizable: true, reorderable: true },
];
```


---

## Lista de datos (`tp-data-list`)

Componente reutilizable que encapsula una lista vertical con header (titulo + badge contador), filtro de texto, estados de carga/vacio, paginacion y soporte para templates de item personalizados. Es el equivalente de `tp-data-table` para representaciones en formato lista (list-group) en lugar de tabla.

**Selector:** `<tp-data-list>`

**Ubicacion:** `shared/components/data-list/`

### Inputs

| Propiedad          | Tipo       | Defecto           | Descripcion                                    |
|--------------------|------------|-------------------|------------------------------------------------|
| `data`             | `Array<T>` | `[]` (required)   | Items de la pagina actual                      |
| `loading`          | `boolean`  | `false`           | Muestra estado de carga (spinner)              |
| `totalElements`    | `number`   | `0`               | Total de elementos (para paginacion y badge)   |
| `currentPage`      | `number`   | `0`               | Pagina actual (0-indexed)                      |
| `pageSize`         | `number`   | `10`              | Elementos por pagina                           |
| `pageSizes`        | `number[]` | `[5, 10, 20, 50]` | Opciones de tamano de pagina                  |
| `title`            | `string`   | `''`              | Titulo en el header (uppercase, bold)          |
| `filterable`       | `boolean`  | `true`            | Muestra el input de filtro                     |
| `filterPlaceholder`| `string`   | `''`              | Placeholder del filtro (fallback a i18n)       |
| `filterText`       | `string`   | `''`              | Texto del filtro actual                        |
| `showAdd`          | `boolean`  | `false`           | Muestra boton "+" en el header                 |
| `showRemove`       | `boolean`  | `false`           | Muestra boton "x" en cada item                 |
| `disabled`         | `boolean`  | `false`           | Deshabilita toda interaccion                   |
| `showPagination`   | `boolean`  | `true`            | Muestra controles de paginacion                |
| `ariaLabel`        | `string`   | `''`              | Label de accesibilidad de la lista             |
| `testId`           | `string`   | `'data-list'`     | Prefijo para `data-testid`                     |

### Outputs

| Evento             | Tipo                   | Descripcion                                    |
|--------------------|------------------------|------------------------------------------------|
| `(pageChange)`     | `EventEmitter<number>` | Emitido al cambiar de pagina                   |
| `(pageSizeChange)` | `EventEmitter<number>` | Emitido al cambiar tamano de pagina            |
| `(filterChange)`   | `EventEmitter<string>` | Emitido al cambiar el texto del filtro         |
| `(add)`            | `EventEmitter<void>`   | Emitido al pulsar el boton "+"                 |
| `(remove)`         | `EventEmitter<T>`      | Emitido al pulsar "x" en un item              |

### Template de item personalizado (TpListItemDirective)

Para personalizar el renderizado de cada item de la lista, se usa la directiva `tpListItem`:

```html
<tp-data-list [data]="items()" ...>
  <ng-template tpListItem let-item>
    <span class="badge bg-primary-subtle text-primary">{{ item.type }}</span>
    <span>{{ item.code }} — {{ item.name }}</span>
  </ng-template>
</tp-data-list>
```

Si no se define un template, se muestra `{{ item }}` como texto plano.

### Estructura visual

```
+-------------------------------------------------------------+
| TITULO  (N)                         [Filtrar...]  [+]       | <- Header
+-------------------------------------------------------------+
| Item 1 contenido personalizado                         [x]  | <- Lista
| Item 2 contenido personalizado                         [x]  |
| Item 3 contenido personalizado                         [x]  |
+-------------------------------------------------------------+
| Mostrando 1-3 de 8   [<] [1] [2] [>]   Pag: [5 v]         | <- Paginacion
+-------------------------------------------------------------+
```

### Estados

| Estado  | Comportamiento                                                   |
|---------|------------------------------------------------------------------|
| Carga   | Muestra `spinner-border` centrado con texto "Cargando..."        |
| Vacio   | Mensaje diferenciado: "sin datos" o "sin resultados del filtro"  |
| Datos   | Renderiza items con `list-group list-group-flush`                |

### Paginacion integrada

El componente incluye un footer con:
- Contador de registros: "Mostrando X-Y de Z"
- Navegacion de paginas (maximo 5 visibles, ventana deslizante)
- Selector de elementos por pagina

Se puede ocultar con `[showPagination]="false"` cuando la paginacion se gestiona externamente (ej: dentro de `tp-selected-*`).

### Accesibilidad

- `role="list"` en el contenedor de items.
- `role="listitem"` en cada item.
- `aria-label` configurable en la lista.
- `aria-label` en el filtro, botones "+" y "x".
- `aria-hidden="true"` en iconos decorativos (chevrons, plus).
- `aria-current="page"` en la pagina activa.

### Estilos

- Usa tokens del Design System (`--tp-border-width`, `--tp-color-border`, `--tp-border-radius`, `--tp-color-background`, `--tp-color-surface`, `--tp-space-*`, `--tp-font-size-sm`, `--tp-font-weight-bold`).
- BEM: `.tp-data-list`, `.tp-data-list__header`, `.tp-data-list__list-wrapper`, etc.
- Responsive: el header y footer se reordenan en pantallas < 576px.
- Estado deshabilitado: `opacity: 0.6`, `pointer-events: none`.

### Ejemplo de uso completo

```html
<tp-data-list
  [data]="filteredReports()"
  [loading]="isLoading()"
  [totalElements]="totalReports()"
  [currentPage]="currentPage()"
  [pageSize]="pageSize()"
  [title]="'INFORMES ASIGNADOS'"
  [filterable]="true"
  [showAdd]="true"
  [showRemove]="true"
  [showPagination]="true"
  (pageChange)="goToPage($event)"
  (pageSizeChange)="changePageSize($event)"
  (filterChange)="onFilter($event)"
  (add)="openModal()"
  (remove)="removeItem($event)"
  ariaLabel="Lista de informes asignados"
  testId="assigned-reports">

  <ng-template tpListItem let-report>
    <span>{{ report.name }}</span>
  </ng-template>
</tp-data-list>
```

### Uso interno en componentes tp-selected-*

Los componentes `tp-selected-reports` y `tp-selected-actions` utilizan `tp-data-list` internamente para renderizar la lista de items seleccionados (con `[showPagination]="false"`), delegando toda la logica visual de header, filtro, lista y estados al componente compartido. Cada uno proporciona su template personalizado via `tpListItem`.

---

## Modal (`tp-modal`)

| Propiedad   | Tipo                        | Defecto  | Descripcion                              |
|-------------|-----------------------------|----------|------------------------------------------|
| `title`     | `string`                    | `''`     | Titulo del modal                         |
| `size`      | `'sm' \| 'md' \| 'lg'`     | `'md'`   | Tamano del modal                         |
| `closable`  | `boolean`                   | `true`   | Muestra boton de cierre                  |

**Eventos:**
- `(closed)`: Emitido al cerrar el modal.
- `(confirmed)`: Emitido al confirmar la accion.

**Accesibilidad:**
- `role="dialog"` y `aria-modal="true"`.
- Foco atrapado dentro del modal mientras esta abierto.
- Cierre con tecla `Escape`.

---

## Card (`tp-card`)

| Propiedad   | Tipo      | Defecto | Descripcion                              |
|-------------|-----------|---------|------------------------------------------|
| `title`     | `string`  | `''`    | Titulo de la cabecera (opcional)         |
| `collapsible` | `boolean` | `false` | Permite colapsar/expandir el contenido  |

**Contenido proyectado:**
- `<ng-content select="[card-header]">`: Cabecera personalizada.
- `<ng-content>`: Cuerpo principal.
- `<ng-content select="[card-footer]">`: Pie de la card.

---

## Alert (`tp-alert`)

| Propiedad    | Tipo                                              | Defecto  | Descripcion                  |
|--------------|---------------------------------------------------|----------|------------------------------|
| `variant`    | `'success' \| 'danger' \| 'warning' \| 'info'`   | `'info'` | Tipo de alerta               |
| `dismissible` | `boolean`                                        | `false`  | Permite cerrar la alerta     |

---

## Badge (`tp-badge`)

| Propiedad | Tipo                                              | Defecto     | Descripcion                |
|-----------|---------------------------------------------------|-------------|----------------------------|
| `variant` | `'primary' \| 'secondary' \| 'success' \| 'danger' \| 'warning' \| 'info'` | `'primary'` | Color del badge |
| `pill`    | `boolean`                                         | `false`     | Forma redondeada (pill)    |

---

## Breadcrumb (`tp-breadcrumb`)

| Propiedad | Tipo                          | Defecto | Descripcion                              |
|-----------|-------------------------------|---------|------------------------------------------|
| `items`   | `Array<{label, routerLink?}>` | `[]`    | Segmentos de la miga de pan              |

**Accesibilidad:**
- `<nav aria-label="breadcrumb">`.
- Ultimo item con `aria-current="page"`.

---

## Tabs (`tp-tabs`)

| Propiedad    | Tipo                           | Defecto | Descripcion                              |
|--------------|--------------------------------|---------|------------------------------------------|
| `tabs`       | `Array<{id, label, disabled?}>` | `[]`   | Definicion de pestanas                   |
| `activeTab`  | `string`                       | —       | ID del tab activo                        |

**Eventos:**
- `(tabChange)`: Emitido al cambiar de pestana.

**Accesibilidad:**
- `role="tablist"`, `role="tab"`, `role="tabpanel"`.
- Navegacion con flechas de teclado.

---

## Spinner (`tp-spinner`)

| Propiedad | Tipo                    | Defecto | Descripcion                              |
|-----------|-------------------------|---------|------------------------------------------|
| `size`    | `'sm' \| 'md' \| 'lg'` | `'md'`  | Tamano del indicador                     |

**Accesibilidad:**
- `role="status"` con `aria-label` descriptivo.

---

## Toast (`tp-toast`)

| Propiedad  | Tipo                                              | Defecto  | Descripcion                          |
|------------|---------------------------------------------------|----------|--------------------------------------|
| `variant`  | `'success' \| 'danger' \| 'warning' \| 'info'`   | `'info'` | Tipo de notificacion                 |
| `duration` | `number`                                          | `5000`   | Milisegundos antes del cierre auto   |
| `closable` | `boolean`                                         | `true`   | Permite cierre manual                |

**Accesibilidad:**
- `role="alert"` y `aria-live="polite"`.

---

## Pagination (`tp-pagination`)

| Propiedad    | Tipo     | Defecto | Descripcion                              |
|--------------|----------|---------|------------------------------------------|
| `total`      | `number` | `0`    | Total de elementos                       |
| `pageSize`   | `number` | `10`   | Elementos por pagina                     |
| `currentPage` | `number` | `1`   | Pagina actual                            |

**Eventos:**
- `(pageChange)`: Emitido al cambiar de pagina.
- `(pageSizeChange)`: Emitido al cambiar el tamano de pagina.

---

## Form Group (`tp-form-group`)

| Propiedad | Tipo     | Defecto | Descripcion                              |
|-----------|----------|---------|------------------------------------------|
| `label`   | `string` | `''`    | Texto del label                          |
| `for`     | `string` | `''`    | ID del control asociado                  |
| `required` | `boolean` | `false` | Muestra indicador de obligatorio        |
| `error`   | `string` | `''`    | Mensaje de error de validacion           |

Agrupa un label, un control de formulario y un mensaje de error/ayuda. Gestiona automaticamente `aria-describedby` entre el campo y el mensaje.

---

## Date Picker (`tp-date-picker`)

| Propiedad   | Tipo      | Defecto | Descripcion                              |
|-------------|-----------|---------|------------------------------------------|
| `min`       | `string`  | —       | Fecha minima seleccionable (ISO)         |
| `max`       | `string`  | —       | Fecha maxima seleccionable (ISO)         |
| `disabled`  | `boolean` | `false` | Deshabilita el selector                  |
| `format`    | `string`  | —       | Formato de visualizacion (via i18n)      |

---

## Date Range (`tp-date-range`)

| Propiedad   | Tipo      | Defecto | Descripcion                              |
|-------------|-----------|---------|------------------------------------------|
| `minDate`   | `string`  | —       | Fecha minima para ambos campos           |
| `maxDate`   | `string`  | —       | Fecha maxima para ambos campos           |
| `disabled`  | `boolean` | `false` | Deshabilita ambos selectores             |

**Validacion:**
- "Desde" no puede ser posterior a "Hasta".
- Ambos campos son opcionales individualmente.

---

## Autocomplete (`tp-autocomplete`)

| Propiedad     | Tipo                             | Defecto | Descripcion                              |
|---------------|----------------------------------|---------|------------------------------------------|
| `searchFn`    | `(term: string) => Observable<T[]>` | —    | Funcion de busqueda                      |
| `displayWith` | `(item: T) => string`            | —       | Funcion para mostrar el valor            |
| `minChars`    | `number`                         | `2`     | Caracteres minimos para buscar           |
| `debounce`    | `number`                         | `300`   | Milisegundos de debounce                 |
| `disabled`    | `boolean`                        | `false` | Deshabilita el campo                     |

**Accesibilidad:**
- `role="combobox"` con `aria-expanded`.
- Lista de sugerencias con `role="listbox"`.
- Navegacion con flechas y seleccion con `Enter`.

---

## Selector de Items (`tp-selected-*`)

Patron de componente reutilizable para gestionar una lista de items seleccionados con un modal de seleccion paginado. Implementado como `ControlValueAccessor` para integrarse directamente con formularios (template-driven y reactive).

**Implementaciones:**

| Componente             | Selector                | Ubicacion                            | Entidad   | Servicio                           |
|------------------------|-------------------------|--------------------------------------|-----------|------------------------------------|
| `TpSelectedReportsComponent` | `<tp-selected-reports>` | `shared/components/selected-reports/` | `Report`  | `ReportService.search()` (server-side) |
| `TpSelectedActionsComponent` | `<tp-selected-actions>` | `shared/components/selected-actions/` | `Action`  | `ProfileService.findAllActions()` (client-side) |

**Implementacion de referencia:** `tp-selected-reports` en `shared/components/selected-reports/`

### Concepto

El componente encapsula el patron completo de:
1. **Listado de items seleccionados** con filtro de texto y boton de eliminar por fila.
2. **Boton "+"** que abre un **modal** de seleccion.
3. **Modal** con tabla paginada, checkboxes, busqueda, select-all por pagina, y botones Aceptar/Cancelar.
4. **ControlValueAccessor** que escribe un array de IDs (`number[]`) como valor del formulario.

El componente carga internamente los datos disponibles desde un servicio (sin depender del padre).

### Estructura visual

```
+-------------------------------------------------------------+
| TITULO  (4)                         [Filtrar...]  [+]       | <- Header
+-------------------------------------------------------------+
| Item seleccionado 1                                    [x]  | <- Lista
| Item seleccionado 2                                    [x]  |
| Item seleccionado 3                                    [x]  |
| Item seleccionado 4                                    [x]  |
+-------------------------------------------------------------+
```

Al pulsar `[+]` se abre el modal:

```
+-------------------------------------------------------------+
|  Seleccionar informes                                  [x]  | <- Modal header
+-------------------------------------------------------------+
|  [buscar informe...]                                        | <- Busqueda
+-------------------------------------------------------------+
|  [ ]  Nombre              Descripcion                       | <- Tabla
|  [v]  Informe actividad   Resumen mensual...                |
|  [ ]  Resumen accesos     Accesos al sistema...             |
|  [v]  Estadisticas uso    Metricas de uso...                |
|  [ ]  Informe errores     Errores registrados...            |
|  [ ]  Consumo interfaces  Operaciones IN/OUT...             |
+-------------------------------------------------------------+
|  Mostrando 1 a 5 de 8    [<] [1] [2] [>]   Pag: [5 v]     | <- Paginacion
+-------------------------------------------------------------+
|  2 seleccionados              [Cancelar]  [Aceptar]         | <- Footer
+-------------------------------------------------------------+
```

### Inputs

| Propiedad          | Tipo      | Defecto            | Descripcion                                    |
|--------------------|-----------|--------------------|------------------------------------------------|
| `title`            | `string`  | `''`               | Titulo en el header (uppercase, bold)          |
| `showAdd`          | `boolean` | `true`             | Muestra el boton "+"                           |
| `showRemove`       | `boolean` | `true`             | Muestra los botones "x" en cada item           |
| `filterPlaceholder`| `string`  | `''`               | Placeholder del filtro (fallback a i18n)       |
| `ariaLabel`        | `string`  | `''`               | Label de accesibilidad de la lista             |
| `testId`           | `string`  | `'selected-reports'`| Prefijo para `data-testid`                    |

### ControlValueAccessor

- **Valor**: `number[]` — array de IDs de items seleccionados.
- Compatible con `ngModel`, `formControlName` y `formControl`.
- Soporta `setDisabledState` (opacidad reducida, sin interaccion).

### Estilos del header

| Elemento      | Estilo                                                            |
|---------------|-------------------------------------------------------------------|
| Titulo        | `font-size: var(--tp-font-size-sm)`, `font-weight: bold`, `uppercase`, `letter-spacing: 0.025em` |
| Badge         | `badge bg-secondary-subtle text-secondary`, `font-size: 0.75rem` |
| Filtro        | `form-control form-control-sm`, ancho `8rem` (expandible a `12rem` en focus) |
| Boton +       | `btn btn-outline-primary`, `font-size: 0.7rem`, `padding: 0.2rem 0.5rem` |

### Estilos de la lista

| Elemento      | Estilo                                                            |
|---------------|-------------------------------------------------------------------|
| Contenedor    | `border-radius: var(--tp-border-radius)`, border, `font-size: 0.8rem` |
| Items         | `list-group-item`, `py-1 px-3`, flex con justify-between         |
| Boton remove  | `btn-close`, `font-size: 0.5rem`                                 |
| Estado vacio  | Centrado, `font-size: 0.75rem`, `text-muted`                     |

### Modal de seleccion

El modal sigue el patron estandar de Bootstrap:

| Aspecto           | Especificacion                                                  |
|-------------------|-----------------------------------------------------------------|
| Tamano            | `modal-lg`, `modal-dialog-centered`                             |
| Busqueda          | `input-group input-group-sm` con icono `bi-search`              |
| Tabla             | `table table-hover tp-table`, columnas: checkbox, nombre, descripcion |
| Checkbox header   | Select-all de la pagina actual                                  |
| Fila seleccionada | Clase `table-active`, click en fila togglea checkbox            |
| Paginacion        | Identica a `tp-data-table`: chevrons, max 5 paginas visibles, selector de page-size (5/10/20) |
| Counter           | `"Mostrando X a Y de Z"` usando `common.pagination.showing`    |
| Footer            | Counter de seleccionados + Cancelar + Aceptar                   |

### Paginacion (identica a tp-data-table)

- **Navegacion**: Chevrons `bi-chevron-left` / `bi-chevron-right`.
- **Paginas visibles**: Maximo 5, centradas en la pagina actual.
- **Selector page-size**: `form-select form-select-sm` con opciones 5, 10, 20.
- **Counter**: Reutiliza la clave i18n `common.pagination.showing`.
- **Accesibilidad**: `aria-current="page"`, `aria-label` en prev/next.

### Estados

| Estado    | Comportamiento                                                     |
|-----------|--------------------------------------------------------------------|
| Carga     | Spinner centrado con texto "Cargando informes..."                  |
| Vacio     | Mensaje centrado: "No hay informes asignados" / "No se encontraron informes con ese filtro" |
| Disabled  | Opacidad 0.6, `pointer-events: none`, inputs y botones deshabilitados |
| Modal vacio | Mensaje en tabla: "No hay informes disponibles"                  |

### Accesibilidad

- `aria-label` en filtro, boton add, boton remove (incluye nombre del item).
- `aria-modal="true"`, `aria-labelledby` en el modal.
- `role="dialog"` en el modal.
- `aria-hidden="true"` en iconos decorativos (`bi-plus`, `bi-search`, `bi-chevron-*`, `bi-check-lg`).
- `aria-current="page"` en la pagina activa de la paginacion.
- Checkboxes con `aria-label` individual.
- Keyboard: Tab navega entre controles, Enter/Space activan.

### Claves de traduccion (i18n)

El componente usa las siguientes claves bajo el namespace `selected-reports`:

```json
{
  "selected-reports": {
    "count": "Total",
    "filter": { "placeholder": "Filtrar...", "aria": "Filtrar informes seleccionados" },
    "add": { "aria": "Anadir informe" },
    "remove": { "aria": "Eliminar informe" },
    "loading": "Cargando informes...",
    "empty": { "filtered": "No se encontraron informes con ese filtro", "none": "No hay informes asignados" },
    "modal": {
      "title": "Seleccionar informes",
      "search": "Buscar informe...",
      "selectAll": "Seleccionar todos",
      "selectReport": "Seleccionar informe",
      "columnName": "Nombre",
      "columnDescription": "Descripcion",
      "noData": "No hay informes disponibles",
      "paginationLabel": "Paginacion de informes",
      "selected": "seleccionados",
      "accept": "Aceptar"
    }
  }
}
```

Ademas reutiliza: `common.pagination.showing`, `common.pagination.previous`, `common.pagination.next`, `common.pagination.pageSize`, `button.cancel`, `button.close`.

### Ejemplo de uso

```html
<tp-selected-reports
  [ngModel]="formUser().reportIds"
  (ngModelChange)="updateFormField('reportIds', $event)"
  name="reportIds"
  [title]="'users.form.sectionReports' | translate"
  testId="user-reports">
</tp-selected-reports>
```

### Variante: `tp-selected-actions`

Componente que gestiona la asignacion de acciones de seguridad a un perfil. Diferencias respecto a `tp-selected-reports`:

- **Paginacion client-side**: Carga todas las acciones via `ProfileService.findAllActions()` en `ngOnInit` y pagina/filtra en memoria.
- **Columnas del modal**: checkbox | codigo | tipo (badge coloreado) | nombre.
- **Items seleccionados**: Muestran badge de tipo (READ/WRITE/EXECUTE) + `code — name`.
- **Badges de tipo**: `READ` → `bg-info-subtle text-info`, `WRITE` → `bg-warning-subtle text-warning`, `EXECUTE` → `bg-success-subtle text-success`.
- **Namespace i18n**: `selected-actions.*`.
- **testId default**: `'selected-actions'`.

Ejemplo de uso (en formulario de perfiles):

```html
<tp-selected-actions
  [ngModel]="selectedActionIds()"
  (ngModelChange)="selectedActionIds.set($event)"
  name="actionIds"
  [title]="'profiles.form.sectionActions' | translate"
  testId="profile-actions">
</tp-selected-actions>
```

### Crear un nuevo componente con este patron

Para crear un componente similar (e.g. `tp-selected-profiles`):

1. Copiar la estructura de `shared/components/selected-reports/`.
2. Renombrar ficheros y clases (e.g. `TpSelectedProfilesComponent`).
3. Cambiar el servicio inyectado y el metodo de carga por el servicio correspondiente.
4. Ajustar el modelo de datos (debe tener al menos `id: number` y `name: string`; opcionalmente `description`).
5. Crear las claves de traduccion bajo un nuevo namespace (e.g. `selected-profiles`).
6. El selector sera `tp-selected-profiles`, el testId default `'selected-profiles'`.
7. El valor del formulario siempre es `number[]` (array de IDs).
8. Mantener la misma estetica (header, boton `btn-outline-primary`, lista `list-group-flush`, modal `modal-lg` con tabla paginada).
9. Decidir si la paginacion es server-side (como reports) o client-side (como actions, cuando el dataset es pequeno).

---

## Entity Filter (`tp-entity-filter`)

| Propiedad    | Tipo                             | Defecto | Descripcion                              |
|--------------|----------------------------------|---------|------------------------------------------|
| `columns`    | `Array<ColumnDef>`               | `[]`    | Columnas a mostrar en la tabla           |
| `items`      | `Array<T>`                       | `[]`    | Elementos seleccionados                  |
| `searchFn`   | `(params) => Observable<Page<T>>` | —      | Funcion de busqueda para el modal        |
| `pageSize`   | `number`                         | `10`    | Elementos por pagina                     |

**Eventos:**
- `(itemsChange)`: Emitido al modificar la lista de seleccionados.

**Comportamiento:**
- Incluye toolbar con botones: Anadir Todos, Anadir, Borrar, Borrar Todos.
- Abre modales para seleccion (listado) y carga masiva (textarea).
- Ver patron completo en [design-system.md](design-system.md#filtro-por-entidad-lista-de-seleccion).

---

# Reglas de Uso

1. **No duplicar**: Antes de crear un componente nuevo, verificar si ya existe uno en `shared/components/` que cubra la necesidad.
2. **No extender con logica de negocio**: Los componentes de `shared/` son genericos. Si se necesita comportamiento especifico de dominio, crear un componente wrapper en el `feature/` correspondiente.
3. **Responsabilidad unica**: Cada componente resuelve un unico problema de interfaz. Si un componente crece en complejidad, descomponerlo en componentes mas pequenos.
4. **Inputs tipados**: Usar interfaces o tipos estrictos para los `@Input()`. Evitar `any`.
5. **Documentar variantes**: Si un componente soporta multiples variantes visuales, documentarlas en su propio README o en este fichero.
6. **Testing obligatorio**: Todo componente reutilizable debe incluir tests unitarios con Angular Testing Library.

---

# Documentacion relacionada

- [design-system.md](design-system.md) — Tokens, catalogo y patrones de pantalla.
- [layout.md](layout.md) — Estructura visual de la aplicacion.
- [navigation.md](navigation.md) — Sistema de navegacion.
- [internacionalizacion.md](internacionalizacion.md) — Sistema de traduccion.
- [angular.md](../../04-development/coding-guidelines/angular.md) — Reglas de codificacion Angular.
