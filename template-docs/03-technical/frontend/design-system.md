# Design System para IA

## Introducción

El **Design System** de Template proporciona un conjunto de reglas, tokens y convenciones visuales documentadas de forma que cualquier agente de IA (asistente de código, generador de interfaces o copiloto de diseño) pueda producir interfaces coherentes con la aplicación sin intervención manual adicional.

Este documento actúa como fuente de verdad para herramientas de generación automática de código frontend.

---

# Objetivos

- Garantizar que el código generado por IA respete la identidad visual de Template.
- Reducir el esfuerzo de revisión humana tras la generación automática.
- Centralizar las decisiones de diseño en un formato interpretable por modelos de lenguaje.
- Establecer restricciones claras que eviten inconsistencias visuales.

---

# Principios de diseño

| Principio      | Descripción                                                                    |
|----------------|--------------------------------------------------------------------------------|
| Consistencia   | Todos los elementos visuales siguen las mismas reglas de espaciado y color.    |
| Accesibilidad  | Contraste mínimo AA (WCAG 2.1). Navegación completa por teclado.              |
| Simplicidad    | Preferir composiciones claras sobre diseños recargados.                        |
| Responsividad  | Todo componente debe funcionar en escritorio, tablet y móvil.                  |
| Reutilización  | Priorizar componentes existentes antes de crear nuevos.                        |

---

# Tokens de diseño

Los tokens son los valores atómicos que definen la apariencia visual. Todo código generado debe referenciar estos tokens en lugar de valores literales.

## Paleta de colores

| Token                      | Valor por defecto | Uso                                    |
|----------------------------|-------------------|----------------------------------------|
| `--tp-color-primary`       | `#0d6efd`         | Acciones principales, enlaces activos  |
| `--tp-color-secondary`     | `#6c757d`         | Elementos secundarios, texto auxiliar  |
| `--tp-color-success`       | `#198754`         | Confirmaciones, estados positivos      |
| `--tp-color-danger`        | `#dc3545`         | Errores, acciones destructivas         |
| `--tp-color-warning`       | `#ffc107`         | Avisos, estados de precaución          |
| `--tp-color-info`          | `#0dcaf0`         | Información contextual                 |
| `--tp-color-background`    | `#ffffff`         | Fondo principal                        |
| `--tp-color-surface`       | `#f8f9fa`         | Fondo de paneles y tarjetas            |
| `--tp-color-text`          | `#212529`         | Texto principal                        |
| `--tp-color-text-muted`    | `#6c757d`         | Texto secundario                       |
| `--tp-color-border`        | `#dee2e6`         | Bordes y separadores                   |

## Tipografía

| Token                       | Valor                              |
|-----------------------------|------------------------------------|
| `--tp-font-family`          | `system-ui, -apple-system, sans-serif` |
| `--tp-font-size-base`       | `1rem` (16px)                      |
| `--tp-font-size-sm`         | `0.875rem`                         |
| `--tp-font-size-lg`         | `1.25rem`                          |
| `--tp-font-size-h1`         | `2.5rem`                           |
| `--tp-font-size-h2`         | `2rem`                             |
| `--tp-font-size-h3`         | `1.75rem`                          |
| `--tp-font-weight-normal`   | `400`                              |
| `--tp-font-weight-medium`   | `500`                              |
| `--tp-font-weight-bold`     | `700`                              |
| `--tp-line-height`          | `1.5`                              |

## Espaciado

Basado en una escala de 4px.

| Token             | Valor   |
|-------------------|---------|
| `--tp-space-1`    | `0.25rem` (4px)  |
| `--tp-space-2`    | `0.5rem` (8px)   |
| `--tp-space-3`    | `1rem` (16px)    |
| `--tp-space-4`    | `1.5rem` (24px)  |
| `--tp-space-5`    | `3rem` (48px)    |

## Bordes y sombras

| Token                    | Valor                                      |
|--------------------------|--------------------------------------------|
| `--tp-border-radius`     | `0.375rem`                                 |
| `--tp-border-radius-lg`  | `0.5rem`                                   |
| `--tp-border-radius-pill`| `50rem`                                    |
| `--tp-border-width`      | `1px`                                      |
| `--tp-shadow-sm`         | `0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)` |
| `--tp-shadow`            | `0 0.5rem 1rem rgba(0, 0, 0, 0.15)`       |
| `--tp-shadow-lg`         | `0 1rem 3rem rgba(0, 0, 0, 0.175)`        |

## Breakpoints

| Token        | Valor    | Dispositivo              |
|--------------|----------|--------------------------|
| `sm`         | `576px`  | Móvil horizontal         |
| `md`         | `768px`  | Tablet                   |
| `lg`         | `992px`  | Escritorio pequeño       |
| `xl`         | `1200px` | Escritorio               |
| `xxl`        | `1400px` | Pantalla amplia          |

---

# Componentes

## Catálogo de componentes

La IA debe generar código utilizando exclusivamente los componentes listados a continuación. No se deben inventar componentes nuevos sin autorización explícita.

| Componente       | Selector                   | Descripción                                   |
|------------------|----------------------------|-----------------------------------------------|
| Botón            | `<tp-button>`              | Acciones del usuario                          |
| Input            | `<tp-input>`               | Entrada de texto                              |
| Select           | `<tp-select>`              | Selección de opciones                         |
| Checkbox         | `<tp-checkbox>`            | Selección múltiple                            |
| Radio            | `<tp-radio>`               | Selección única                               |
| Tabla            | `<tp-table>`               | Listados con paginación, orden y filtrado     |
| Modal            | `<tp-modal>`               | Diálogos y confirmaciones                     |
| Card             | `<tp-card>`                | Contenedor con cabecera y cuerpo              |
| Alert            | `<tp-alert>`               | Mensajes informativos                         |
| Badge            | `<tp-badge>`               | Etiquetas de estado                           |
| Breadcrumb       | `<tp-breadcrumb>`          | Navegación jerárquica                         |
| Tabs             | `<tp-tabs>`                | Navegación por pestañas dentro de una vista   |
| Spinner          | `<tp-spinner>`             | Indicador de carga                            |
| Toast            | `<tp-toast>`               | Notificaciones temporales                     |
| Pagination       | `<tp-pagination>`          | Navegación entre páginas de datos             |
| Form Group       | `<tp-form-group>`          | Agrupación de campo + label + validación      |
| Date Picker      | `<tp-date-picker>`         | Selección de fecha                            |
| Autocomplete     | `<tp-autocomplete>`        | Búsqueda con sugerencias                      |
| Entity Filter    | `<tp-entity-filter>`       | Filtro por entidad con lista de selección     |
| Date Range       | `<tp-date-range>`          | Selector de rango de fechas (desde - hasta)   |

## Variantes de botones

| Variante     | Clase / Input             | Uso                              |
|--------------|---------------------------|----------------------------------|
| Primary      | `variant="primary"`       | Acción principal de la pantalla  |
| Secondary    | `variant="secondary"`     | Acciones secundarias             |
| Danger       | `variant="danger"`        | Eliminación, acciones críticas   |
| Outline      | `variant="outline"`       | Acciones terciarias              |
| Link         | `variant="link"`          | Navegación sin apariencia botón  |
| Icon         | `variant="icon"`          | Solo icono, sin texto            |

## Tamaños

| Tamaño | Input         | Uso                                  |
|--------|---------------|--------------------------------------|
| `sm`   | `size="sm"`   | Tablas densas, toolbars              |
| `md`   | `size="md"`   | Uso general (por defecto)            |
| `lg`   | `size="lg"`   | Formularios prominentes, CTAs        |

---

# Patrones de pantalla

La IA debe respetar los siguientes patrones cuando genere pantallas completas.

## Listado (CRUD - Read)

```text
┌─────────────────────────────────────────────┐
│ Título de la entidad                [+ Nuevo]│
├─────────────────────────────────────────────┤
│ Filtros: campo1 | campo2 | [Buscar] [Limpiar]│
├─────────────────────────────────────────────┤
│ Tabla con columnas relevantes               │
│   - Ordenable por cabeceras                 │
│   - Acciones por fila: ver, editar, eliminar│
├─────────────────────────────────────────────┤
│ Paginación                                  │
└─────────────────────────────────────────────┘
```

## Formulario (CRUD - Create / Update)

```text
┌─────────────────────────────────────────────┐
│ Título: Nuevo/Editar [Entidad]              │
├─────────────────────────────────────────────┤
│ Sección 1: Datos generales                  │
│   campo1     campo2                         │
│   campo3     campo4                         │
├─────────────────────────────────────────────┤
│ Sección 2: Configuración                    │
│   campo5     campo6                         │
├─────────────────────────────────────────────┤
│ [Cancelar]                      [Guardar]   │
└─────────────────────────────────────────────┘
```

## Detalle (CRUD - Read one)

```text
┌─────────────────────────────────────────────┐
│ Título: [Entidad] - Detalle                 │
├─────────────────────────────────────────────┤
│ Tabs: General | Historial | Auditoría       │
├─────────────────────────────────────────────┤
│ Contenido del tab activo                    │
├─────────────────────────────────────────────┤
│ [Volver]              [Editar] [Eliminar]   │
└─────────────────────────────────────────────┘
```

---

# Filtros

Los filtros permiten al usuario reducir los resultados mostrados en un listado. Existen dos tipos principales de filtro según la naturaleza del criterio de búsqueda.

## Filtro por entidad (lista de selección)

Cuando el usuario necesita filtrar por una entidad relacionada, el filtro se presenta como una lista de elementos seleccionados con acciones de gestión.

### Estructura visual

```text
┌────────────────────────────────────────────────┐ [+] [↑] [✕] [⊘]
│ Lista por campo1 de elementos seleccionados    │
│   - Ordenable por cabeceras                    │
│   - Acciones por fila: seleccionar             │
├────────────────────────────────────────────────┤
│ Paginación                                     │
└────────────────────────────────────────────────┘
```

### Botones de acción

Los botones se representan exclusivamente con iconos (sin texto) para minimizar el espacio ocupado.

| Botón         | Icono            | Acción                                                        |
|---------------|------------------|---------------------------------------------------------------|
| Añadir Todos  | `bi-plus-circle` | Abre modal con formulario de texto (ver detalle abajo)        |
| Añadir        | `bi-plus`        | Abre modal con listado simple para seleccionar elementos      |
| Borrar        | `bi-x`           | Elimina el elemento seleccionado de la lista                  |
| Borrar Todos  | `bi-x-circle`    | Muestra diálogo de confirmación y elimina todos los elementos |

### Comportamiento de cada acción

#### Añadir Todos

Al pulsar, se abre una ventana modal con:

```text
┌─────────────────────────────────────────────┐
│ Título: Añadir múltiples elementos          │
├─────────────────────────────────────────────┤
│ <tp-form-group>                             │
│   Label: "Introduzca un valor por línea"    │
│   <textarea>                                │
│     valor1                                  │
│     valor2                                  │
│     valor3                                  │
│   </textarea>                               │
│ </tp-form-group>                            │
├─────────────────────────────────────────────┤
│ [Cancelar]                      [Aceptar]   │
└─────────────────────────────────────────────┘
```

Cada línea del textarea representa el campo identificativo (campo1) de un elemento de la entidad. Al aceptar, los elementos válidos se añaden a la lista de seleccionados.

#### Añadir

Al pulsar, se abre una ventana modal con un **Listado Simple** que permite buscar y seleccionar elementos individuales:

```text
┌─────────────────────────────────────────────┐
│ Título: Seleccionar [Entidad]               │
├─────────────────────────────────────────────┤
│ Filtro rápido: [campo de búsqueda]          │
├─────────────────────────────────────────────┤
│ Tabla con columnas relevantes               │
│   - Selección múltiple (checkbox)           │
│   - Ordenable por cabeceras                 │
├─────────────────────────────────────────────┤
│ Paginación                                  │
├─────────────────────────────────────────────┤
│ [Cancelar]                   [Seleccionar]  │
└─────────────────────────────────────────────┘
```

#### Borrar

Elimina de la lista el elemento que tiene el foco o está seleccionado. No requiere confirmación.

#### Borrar Todos

Muestra un diálogo de confirmación:

```text
┌─────────────────────────────────────────────┐
│ ¿Eliminar todos los elementos seleccionados?│
├─────────────────────────────────────────────┤
│ Esta acción no se puede deshacer.           │
├─────────────────────────────────────────────┤
│ [Cancelar]                   [Confirmar]    │
└─────────────────────────────────────────────┘
```

Si el usuario confirma, se vacía la lista completa.

### Componente

| Selector              | Descripción                                         |
|-----------------------|-----------------------------------------------------|
| `<tp-entity-filter>`  | Filtro por entidad con lista de selección y modales |

---

## Filtro por atributo

Cuando el usuario filtra por un atributo concreto de una entidad (texto, número, fecha, etc.), se aplican las siguientes reglas:

### Validación

- El filtro aplica los **mismos validadores de formato** que el formulario de creación/edición de la entidad.
- **Excepción**: no se valida la unicidad del valor (no se comprueba si ya existe).
- Los mensajes de validación son los mismos que en el formulario, traducidos mediante `i18n`.

### Filtro de tipo fecha (rango)

Cuando el atributo es de tipo fecha, el filtro debe permitir la búsqueda por **rango de fechas**:

```text
┌─────────────────────────────────────────────────────┐
│ [Fecha desde]  —  [Fecha hasta]                     │
└─────────────────────────────────────────────────────┘
```

| Selector               | Descripción                                |
|------------------------|--------------------------------------------|
| `<tp-date-range>`      | Selector de rango de fechas (desde - hasta)|

Reglas:

- Ambos campos son opcionales individualmente (permite buscar "desde X" o "hasta Y").
- Si se informan ambos, "desde" no puede ser posterior a "hasta" (validación cruzada).
- Se utiliza el componente `<tp-date-picker>` para cada campo del rango.
- Formato de fecha consistente con la configuración de internacionalización.

### Tipos de filtro por atributo

| Tipo de atributo | Componente                        | Comportamiento                                      |
|------------------|-----------------------------------|-----------------------------------------------------|
| Texto            | `<tp-input>`                      | Búsqueda parcial (contains). Validación de formato. |
| Número           | `<tp-input type="number">`        | Validación de rango y formato numérico.             |
| Fecha            | `<tp-date-range>`                 | Rango desde-hasta.                                  |
| Boolean          | `<tp-select>` con Sí/No/Todos    | Selección de estado.                                |
| Enum             | `<tp-select>` con opciones        | Lista de valores posibles.                          |
| Entidad          | `<tp-entity-filter>`              | Lista de selección (ver sección anterior).          |

---

## Barra de filtros

La disposición general de los filtros en un listado es:

```text
┌───────────────────────────────────────────────────────────────┐
│ Filtro1        Filtro2        Filtro3        [Buscar][Limpiar]│
├───────────────────────────────────────────────────────────────┤
│ Filtro4 (entity-filter, ocupa ancho completo)                 │
└───────────────────────────────────────────────────────────────┘
```

Reglas de disposición:

- Los filtros simples (texto, número, boolean, enum, fecha) se muestran en línea, agrupados en filas.
- Los filtros de tipo entidad (`<tp-entity-filter>`) ocupan el ancho completo y se sitúan debajo de los filtros simples.
- Los botones [Buscar] y [Limpiar] se alinean a la derecha de la última fila de filtros simples.
- Cada filtro incluye su label visible por encima del campo.

---

# Reglas de generación para IA

## Obligatorias

1. Usar exclusivamente componentes del catálogo.
2. Aplicar tokens de diseño en lugar de valores CSS literales.
3. Incluir atributos de accesibilidad (`aria-label`, `aria-describedby`, `role`).
4. Incluir `data-testid` en todos los elementos interactivos.
5. Respetar la estructura de carpetas definida en las coding guidelines de Angular.
6. No añadir dependencias externas sin autorización explícita.
7. Todo texto visible al usuario debe pasar por el sistema de internacionalización (`i18n`).
8. Validación de formularios en el cliente con mensajes traducidos.
9. Usar `OnPush` como estrategia de detección de cambios.
10. Separar plantilla, estilos y lógica en ficheros independientes.

## Prohibidas

1. No usar estilos inline (`style="..."`).
2. No usar `!important`.
3. No crear componentes que dupliquen funcionalidades existentes en `shared/`.
4. No hacer llamadas HTTP directamente desde componentes.
5. No usar colores fuera de la paleta definida.
6. No usar tamaños de fuente fuera de la escala tipográfica.
7. No omitir estados de carga y error en pantallas con datos remotos.

---

# Iconografía

| Categoría  | Librería                   | Formato                |
|------------|----------------------------|------------------------|
| Iconos UI  | Bootstrap Icons            | SVG inline o font icon |

## Convenciones

- Tamaño por defecto: `1em` (hereda del texto circundante).
- Color: hereda del texto circundante (`currentColor`).
- Iconos decorativos: `aria-hidden="true"`.
- Iconos informativos: incluir `aria-label` descriptivo.

---

# Estados de componentes

Todo componente interactivo debe contemplar los siguientes estados:

| Estado     | Descripción                                |
|------------|--------------------------------------------|
| Default    | Estado normal sin interacción              |
| Hover      | Cursor sobre el elemento                   |
| Focus      | Foco vía teclado (anillo visible)          |
| Active     | Durante la pulsación                       |
| Disabled   | No interactuable, opacidad reducida        |
| Loading    | Ejecutando acción, spinner visible         |
| Error      | Validación fallida, borde rojo + mensaje   |
| Success    | Acción completada, feedback visual         |

---

# Animaciones y transiciones

| Tipo              | Duración     | Easing                 |
|-------------------|--------------|------------------------|
| Hover / Focus     | `150ms`      | `ease-in-out`          |
| Apertura modal    | `200ms`      | `ease-out`             |
| Cierre modal      | `150ms`      | `ease-in`              |
| Toast entrada     | `300ms`      | `ease-out`             |
| Toast salida      | `200ms`      | `ease-in`              |
| Collapse/Expand   | `250ms`      | `ease-in-out`          |

Regla general: no utilizar animaciones mayores a `400ms`. Respetar `prefers-reduced-motion`.

---

# Tema oscuro

El Design System soporta un tema oscuro. Los tokens se redefinen mediante la clase `.tp-dark` en el elemento raíz.

| Token (dark)               | Valor                |
|----------------------------|----------------------|
| `--tp-color-background`    | `#1a1d21`            |
| `--tp-color-surface`       | `#2b2f35`            |
| `--tp-color-text`          | `#e9ecef`            |
| `--tp-color-text-muted`    | `#adb5bd`            |
| `--tp-color-border`        | `#495057`            |

Los colores semánticos (primary, success, danger, etc.) mantienen sus valores en ambos temas.

---

# Densidad

La aplicación soporta dos modos de densidad:

| Modo       | Padding base  | Uso                              |
|------------|---------------|----------------------------------|
| `normal`   | `--tp-space-3`| Formularios, vistas de detalle   |
| `compact`  | `--tp-space-2`| Tablas densas, paneles laterales |

La IA debe aplicar densidad `compact` en tablas y `normal` en el resto de contextos salvo indicación contraria.

---

# Ejemplo de generación

A continuación se muestra un ejemplo de cómo la IA debe generar un componente de listado.

```html
<!-- user-list.component.html -->
<div class="container-fluid">
  <div class="d-flex justify-content-between align-items-center mb-4">
    <h1>{{ 'user.list.title' | translate }}</h1>
    <tp-button variant="primary" (click)="onCreate()" data-testid="btn-create-user">
      <i class="bi bi-plus" aria-hidden="true"></i>
      {{ 'common.actions.new' | translate }}
    </tp-button>
  </div>

  <tp-card>
    <tp-table
      [data]="users()"
      [columns]="columns"
      [loading]="isLoading()"
      [pagination]="true"
      [pageSize]="20"
      (sort)="onSort($event)"
      (pageChange)="onPageChange($event)"
      data-testid="table-users">
    </tp-table>
  </tp-card>
</div>
```

```typescript
// user-list.component.ts
@Component({
  selector: 'app-user-list',
  standalone: true,
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, TpButtonComponent, TpCardComponent, TpTableComponent]
})
export class UserListComponent {
  private readonly userService = inject(UserService);

  users = signal<User[]>([]);
  isLoading = signal<boolean>(false);
}
```

---

# Validación del código generado

Tras generar código, la IA debe verificar los siguientes puntos:

- [ ] Usa solo componentes del catálogo.
- [ ] Aplica tokens en lugar de valores literales.
- [ ] Incluye `data-testid` en elementos interactivos.
- [ ] Todos los textos pasan por `translate`.
- [ ] Componente usa `OnPush`.
- [ ] No hay estilos inline.
- [ ] Los formularios incluyen validación con mensajes de error visibles.
- [ ] Se gestionan estados de carga y error.
- [ ] Cumple estructura de carpetas (`features/<entidad>/components/`).
- [ ] Atributos de accesibilidad presentes.

---

# Documentación relacionada

- [layout.md](layout.md)
- [navigation.md](navigation.md)
- [internacionalizacion.md](internacionalizacion.md)
- [notifications.md](notifications.md)
- [angular.md](../../04-development/coding-guidelines/angular.md)

---

# Resumen

El Design System para IA define los tokens, componentes, patrones y restricciones que cualquier agente de inteligencia artificial debe seguir para generar interfaces coherentes con Template. Su adopción elimina ambigüedades en la generación automática de código y reduce la necesidad de ajustes manuales posteriores.
