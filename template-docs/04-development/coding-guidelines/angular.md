# Reglas de Codificación — Angular / Frontend

Directrices de codificación para el frontend con Angular 22 y Bootstrap 5.3.8.

## General

- Versión: **Angular 22**.
- Framework de estilos: **Bootstrap 5.3.8**.
- Todo el código en inglés.
- **TypeScript strict mode** activado.

## Nomenclatura

| Elemento            | Convención                          | Ejemplo                    |
|---------------------|-------------------------------------|----------------------------|
| Componentes         | PascalCase + sufijo                 | `UserListComponent`        |
| Servicios           | PascalCase + sufijo                 | `AuthService`              |
| Ficheros            | kebab-case + tipo                   | `user-list.component.ts`   |
| Variables y métodos | camelCase                           | `getUserById`, `isLoading` |
| Constantes          | UPPER_SNAKE_CASE                    | `API_BASE_URL`             |
| Interfaces          | PascalCase con prefijo `I` opcional | `User`, `IUserResponse`    |

## Estructura de Carpetas

```
src/
└── app/
    ├── core/               # Servicios singleton, guards, interceptors
    ├── shared/             # Componentes, pipes y directivas reutilizables
    ├── features/
    │   ├── user/
    │   │   ├── components/
    │   │   ├── services/
    │   │   ├── models/
    │   │   └── user.module.ts
    │   └── ...
    └── app.module.ts
```

## Componentes

- **Principio de Responsabilidad Única (SRP):** cada componente debe tener una única responsabilidad bien definida. Si un componente gestiona más de una funcionalidad (por ejemplo, visualización y edición, o listado y detalle), se debe dividir en componentes más pequeños y cohesivos.
- **Reutilización obligatoria:** antes de crear un componente nuevo o escribir lógica de tabla/paginación/formulario inline, se debe consultar el catálogo de componentes reutilizables (`shared/components/`) documentado en `template-docs/03-technical/frontend/components.md`. Si ya existe un componente que cubre la necesidad (por ejemplo, `tp-data-table` para listados con paginación), se debe usar en lugar de reimplementar la funcionalidad.
- Preferir componentes standalone (Angular 22).
- Separar plantilla (`.html`), estilos (`.scss`) y lógica (`.ts`).
- Usar `OnPush` como estrategia de detección de cambios cuando sea posible.
- Delegar la lógica de negocio y acceso a datos a servicios; el componente solo se encarga de la interacción con la vista.

## Servicios

- Usar `HttpClient` para llamadas HTTP.
- Gestionar errores HTTP con `catchError`.
- Nunca hacer llamadas HTTP desde un componente directamente.

## Estilos con Bootstrap

- Clases utilitarias de Bootstrap 5 en lugar de estilos inline.
- Variables SCSS de Bootstrap para personalización.
- Evitar `!important`.

## Configuración y Propiedades

Convención: `<nombreAplicacion>.<funcionalidad>.<propiedad>` en `environment.ts`.

## Entornos y Perfiles

Las configuraciones de entorno de Angular **deben estar alineadas** con los perfiles Maven del backend. Por cada perfil Maven debe existir un fichero de entorno Angular equivalente y una configuración de build en `angular.json`.

### Correspondencia obligatoria

| Perfil Maven | Configuración Angular | Fichero de entorno             | Descripción                             |
|--------------|-----------------------|--------------------------------|-----------------------------------------|
| `local`      | `local`               | `environment.ts`               | Desarrollo local (por defecto en serve) |
| `dist`       | `dist`                | `environment.dist.ts`          | Distribución (dev, int, qa, pro)        |
| `test`       | `test`                | `environment.test.ts`          | Testing                                 |

### Reglas

- Si se añade un nuevo perfil Maven, **se debe crear** el fichero `environment.<perfil>.ts` correspondiente y añadir la configuración en `angular.json`.
- El campo `profile` en cada fichero de entorno debe coincidir con el nombre del perfil Maven.
- `ng serve` usa la configuración `local` por defecto.
- `ng build` usa la configuración `dist` por defecto (build de producción/distribución).
- No utilizar nombres genéricos como `production` o `development` para las configuraciones de Angular; usar siempre los nombres de los perfiles Maven.

## Testing

- **Jest** como framework principal.
- **Angular Testing Library** para tests de componentes.
- **HttpClientTestingModule** para mockear HTTP.
- Nomenclatura: `<nombre>.spec.ts`.
- Patrón arrange / act / assert.
- Usar `data-testid` para seleccionar elementos.

### Obligatoriedad de tests

- **Todo componente Angular debe tener su fichero de test** (`.spec.ts`) asociado. No se considera completo un componente sin sus tests.
- **Al crear un componente nuevo**: se debe generar su `.spec.ts` correspondiente como parte de la misma tarea. El componente no está terminado hasta que sus tests existan y pasen.
- **Al modificar un componente existente que no tenga tests**: se deben crear los tests del componente como parte de la modificación, cubriendo al menos el comportamiento existente y los cambios realizados. No se deben aplicar cambios a un componente sin tests sin antes crearlos.

## Formularios con Modo View (Readonly)

Las entidades que tienen formulario de creación/edición deben usar un **único componente de formulario** con tres modos: `'create'`, `'edit'` y `'view'`. No se deben crear componentes de detalle separados.

### Tipo FormMode

```typescript
type FormMode = 'create' | 'edit' | 'view';
```

### Reglas del modo `view`

| Aspecto | Comportamiento |
|---------|---------------|
| Inputs | `readonly` + `disabled` (replica el patrón de action-form, fondo gris Bootstrap) |
| Select | Se sustituye por un `<input readonly disabled>` con el valor textual (ej: `profileName`) |
| Password | Se muestra con valor enmascarado (`••••••••`), `readonly disabled` |
| Campos de auditoría | Visibles solo en modo `view` (ej: `createdAt`, `lastModifiedAt`, `lastAccess`) |
| Componentes CVA (ej: `tp-selected-reports`) | `[disabled]="true"`, `[showAdd]="false"`, `[showRemove]="false"` |
| Botones de acción | No se muestran Save/Cancel; se muestran Edit, Delete (condicional a permisos) y Back |
| Indicadores obligatorios (`*`) | No se muestran en modo view |
| Validación | Deshabilitada (`[required]="false"` o condicional) |

### Estructura del componente

```typescript
@Component({ ... })
export class EntityFormComponent {
  readonly mode = input.required<FormMode>();
  readonly isReadonly = computed(() => this.mode() === 'view');
  readonly canWrite = input<boolean>(false);

  // Outputs para modo view
  readonly edit = output<EntityDTO>();
  readonly delete = output<EntityDTO>();

  // Outputs para modo create/edit
  readonly save = output<EntityDTO>();
  readonly cancel = output<void>();
}
```

### Patrón de estilo para campos no editables

Usar `readonly` + `disabled` juntos en los inputs (mismo patrón que el campo `code` en action-form):

```html
<input type="text"
       class="form-control form-control-sm"
       [value]="..."
       readonly
       disabled
       [attr.aria-label]="...">
```

Esto aplica el estilo visual de Bootstrap (fondo `var(--bs-secondary-bg)`) que señaliza claramente al usuario que el campo no es editable.

### Integración con el componente padre

El componente padre (ej: `UsersComponent`) gestiona los modos mediante un signal `formMode`:

```typescript
readonly formMode = signal<'create' | 'edit' | 'view'>('create');

showDetail(entity: EntityDTO): void {
  this.formEntity.set({ ...entity });
  this.formMode.set('view');
  this.viewMode.set('detail');
}
```

Y en el template:

```html
@if (viewMode() === 'detail') {
  <app-entity-form
    [mode]="formMode()"
    [entity]="formEntity()"
    [canWrite]="canWrite()"
    (cancel)="backToList()"
    (edit)="showEditForm($event)"
    (delete)="confirmDelete($event)" />
}
```
