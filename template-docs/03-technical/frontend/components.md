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
            ├── table/
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

## Tabla (`tp-table`)

| Propiedad    | Tipo                          | Defecto | Descripcion                                |
|--------------|-------------------------------|---------|--------------------------------------------|
| `data`       | `Array<T>`                    | `[]`    | Datos a mostrar                            |
| `columns`    | `Array<ColumnDef>`            | `[]`    | Definicion de columnas                     |
| `loading`    | `boolean`                     | `false` | Muestra estado de carga                    |
| `pagination` | `boolean`                     | `true`  | Habilita paginacion                        |
| `pageSize`   | `number`                      | `10`    | Elementos por pagina                       |
| `selectable` | `boolean`                     | `false` | Permite seleccion de filas                 |
| `sortable`   | `boolean`                     | `true`  | Permite ordenacion por columnas            |

**Eventos:**
- `(sort)`: Emitido al cambiar la ordenacion.
- `(pageChange)`: Emitido al cambiar de pagina.
- `(rowSelect)`: Emitido al seleccionar una fila.

**Estados:**
- Carga: Muestra `<tp-spinner>` superpuesto.
- Vacio: Muestra mensaje "No hay datos disponibles" (traducido).
- Error: Muestra `<tp-alert variant="danger">` con mensaje de error.

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
