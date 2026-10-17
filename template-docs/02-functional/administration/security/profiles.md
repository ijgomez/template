# Perfiles (Gestión de perfiles)

Documentación funcional y técnica de la pantalla de gestión de perfiles, dentro del módulo de Administración > Seguridad. Permite consultar, filtrar, crear, editar y eliminar los perfiles de la aplicación, así como asociarles las acciones a las que tienen acceso.

- **Ruta frontend:** `/administration/security/profiles`
- **Componentes:** `ProfileListComponent` (listado) y `ProfileFormComponent` (detalle / alta / edición)
- **Endpoint backend base:** `/api/v1/administration/security/profiles` (`ProfileController`)
- **Acceso:** el módulo exige `PROFILE_READ` y la escritura requiere `PROFILE_WRITE`; además `GET /references` se permite a usuarios con cualquiera de `USER_READ`, `USER_WRITE`, `PROFILE_READ` o `PROFILE_WRITE`

---

## 1. Requisitos

Identificadores locales de este documento: `RF-PRO-*` (requisitos funcionales) y `RNF-PRO-*` (requisitos no funcionales).

### 1.1. Requisitos funcionales

#### RF-PRO-1: Consulta paginada de perfiles

**Descripción:** el sistema debe permitir consultar los perfiles en un listado paginado y ordenable.

**Criterios de aceptación:**
- AC1.1: El listado muestra las columnas nombre, descripción, acciones y fecha de creación.
- AC1.2: Todas las columnas son ordenables (ascendente/descendente).
- AC1.3: La paginación permite navegar entre páginas y cambiar el tamaño de página.

#### RF-PRO-2: Búsqueda y filtrado

**Descripción:** el sistema debe permitir filtrar el listado por nombre.

**Criterios de aceptación:**
- AC2.1: El filtro de nombre aplica coincidencia parcial.
- AC2.2: Al aplicar el filtro, el listado vuelve a la primera página.
- AC2.3: La acción de limpiar restablece el filtro y recarga el listado completo.

#### RF-PRO-3: Alta de perfil

**Descripción:** un usuario con permiso de escritura debe poder crear nuevos perfiles.

**Criterios de aceptación:**
- AC3.1: El formulario exige nombre y permite definir una descripción y una colección de acciones.
- AC3.2: Un alta válida devuelve 201 y el nuevo perfil aparece en el listado.
- AC3.3: No se permiten acciones duplicadas dentro del mismo perfil.
- AC3.4: Tras el alta correcta se vuelve al listado y se recarga.

#### RF-PRO-4: Edición de perfil

**Descripción:** un usuario con permiso de escritura debe poder modificar los datos de un perfil existente.

**Criterios de aceptación:**
- AC4.1: Se puede cambiar el nombre y la descripción.
- AC4.2: Se puede reemplazar la lista de acciones asignadas.
- AC4.3: Una edición válida devuelve 200 y el cambio se refleja en el listado.

#### RF-PRO-5: Eliminación de perfil

**Descripción:** un usuario con permiso de escritura debe poder eliminar un perfil, con confirmación previa.

**Criterios de aceptación:**
- AC5.1: La eliminación solicita confirmación explícita mediante un modal.
- AC5.2: Una eliminación confirmada devuelve 204 y el perfil desaparece del listado.
- AC5.3: Cancelar la confirmación no elimina el perfil.
- AC5.4: Un perfil asignado a usuarios no puede eliminarse y devuelve error de uso.

#### RF-PRO-6: Detalle de perfil

**Descripción:** el sistema debe permitir consultar el detalle de un perfil en modo solo lectura.

**Criterios de aceptación:**
- AC6.1: El detalle se abre seleccionando una fila y pulsando el botón *Detalle* (`btn-detail`), que solo está habilitado cuando hay una fila seleccionada, o mediante doble clic sobre la fila.
- AC6.2: El detalle muestra los datos generales y la lista de acciones asignadas.
- AC6.3: Se muestran también las fechas de creación y última modificación.

#### RF-PRO-7: Exportación a CSV

**Descripción:** el sistema debe permitir exportar el listado filtrado a un fichero CSV.

**Criterios de aceptación:**
- AC7.1: La exportación incluye todos los registros que cumplen los filtros activos, no solo la página visible.
- AC7.2: El fichero descargado sigue el patrón `profiles_YYYY-MM-DD.csv`.
- AC7.3: Si no hay filas que cumplan los filtros, se notifica que no hay datos que exportar.

### 1.2. Requisitos no funcionales

- **RNF-PRO-1 (Autorización):** el acceso requiere sesión y la acción `PROFILE_READ`; las operaciones de escritura requieren `PROFILE_WRITE`.
- **RNF-PRO-2 (Visibilidad de acciones):** los botones de crear, editar y eliminar solo se muestran a usuarios con `PROFILE_WRITE`.
- **RNF-PRO-3 (Integridad de permisos):** un perfil no puede contener acciones duplicadas y cada acción debe existir en el catálogo.
- **RNF-PRO-4 (Idioma):** todos los textos de la pantalla son traducibles (ES / EN) mediante el grupo i18n `profiles.*`.
- **RNF-PRO-5 (Feedback):** toda operación (crear, editar, eliminar, exportar, paginar) informa al usuario mediante notificaciones de progreso, éxito o error.

---

## 2. Parte funcional

### 2.1. Objetivo

Ofrecer a los administradores una pantalla para gestionar los perfiles de permisos del sistema:

- Consultar el listado paginado y filtrado de perfiles.
- Ver el detalle de un perfil con sus acciones asignadas.
- Crear, editar y eliminar perfiles.
- Asociar una lista de acciones a cada perfil.
- Exportar el listado filtrado a CSV.

### 2.2. Vistas de la pantalla

La pantalla gestiona cuatro modos de vista (`viewMode`) dentro del mismo componente:

| Modo     | Descripción                                               |
|----------|-----------------------------------------------------------|
| `list`   | Listado paginado con barra de filtros y barra de acciones |
| `detail` | Vista de solo lectura del perfil (incluye auditoría)      |
| `create` | Formulario de alta de perfil                              |
| `edit`   | Formulario de edición de perfil                           |

### 2.3. Patrón visual reutilizable y wireframes

La estructura visual base de esta pantalla se define en [layout.md](../../../03-technical/frontend/layout.md). Ese documento es la referencia canónica para los templates `List Screen`, `Form Screen` y `Confirmation Modal`; la documentación funcional del perfil solo describe cómo se aplican a la entidad concreta.

| Tipo de pantalla     | Uso en perfiles                          | Estructura base                                             |
|----------------------|------------------------------------------|-------------------------------------------------------------|
| `List screen`        | Listado principal                        | Cabecera, filtros, tabla, acciones y paginación             |
| `Form screen`        | Alta, edición y consulta en modo lectura | Encabezado, campos, validación, auditoría y pie de acciones |
| `Confirmation modal` | Eliminación                              | Mensaje de confirmación con aceptar/cancelar                |

#### 2.3.1. Wireframe del `List screen`

```text
+------------------------------------------------------------------+
| Perfiles                                                         |
| [Crear] [Exportar]                                               |
+------------------------------------------------------------------+
| Filtro nombre | [Buscar] [Limpiar]                               |
+------------------------------------------------------------------+
| Nombre | Descripción | Acciones | Fecha creación                 |
|--------|-------------|----------|-------------------------------|
| ADMIN  | ...         | 12       | 2026-09-29                    |
| USER   | ...         | 8        | 2026-09-28                    |
+------------------------------------------------------------------+
| < 1 2 3 > | Registros por página: 10                           |
+------------------------------------------------------------------+
```

#### 2.3.2. Wireframe del `Form screen`

```text
+------------------------------------------------------------------+
| Crear perfil / Editar perfil                                     |
+------------------------------------------------------------------+
| Nombre * | [texto]                                               |
| Descripción | [textarea]                                         |
| Acciones asignadas | [multiselect]                               |
+------------------------------------------------------------------+
| [Guardar] [Cancelar]                                             |
+------------------------------------------------------------------+
```

#### 2.3.3. Wireframe del `Form screen` en modo lectura

```text
+------------------------------------------------------------------+
| Consultar perfil                                                 |
| [Volver] [Editar]                                                |
+------------------------------------------------------------------+
| Nombre | [ADMIN]                                                 |
| Descripción | [Perfil de administración]                         |
| Acciones asignadas | [12]                                        |
| Auditoría: Creado 2026-09-01 | Última modificación 2026-09-15    |
+------------------------------------------------------------------+
```

En perfiles, el `List screen` soporta filtrado por nombre, el `Form screen` integra la selección de acciones y el mismo `Form screen` en modo lectura muestra la auditoría y la relación con permisos. El patrón visual es equivalente al de usuarios y acciones, con campos y columnas específicos de cada entidad.

### 2.4. Listado

**Columnas de la tabla** (todas ordenables y reordenables):

| Columna           | Clave i18n                    | Notas                                  |
|-------------------|-------------------------------|----------------------------------------|
| Nombre            | `profiles.fields.name`        | Se muestra en negrita                  |
| Descripción       | `profiles.fields.description` | Muestra `-` si está vacía              |
| Acciones          | `profiles.fields.actions`     | Cuenta el número de acciones asignadas |
| Fecha de creación | `profiles.fields.createdAt`   | Formateado con `localDate`             |

**Filtros disponibles:**

| Filtro | Tipo                         | `data-testid` |
|--------|------------------------------|---------------|
| Nombre | Texto (coincidencia parcial) | `filter-name` |

**Barra de acciones:**

| Acción       | Condición de disponibilidad                      | `data-testid` |
|--------------|--------------------------------------------------|---------------|
| Detalle      | Requiere una fila seleccionada                   | `btn-detail`  |
| Crear        | Requiere `PROFILE_WRITE`                         | `btn-create`  |
| Editar       | Requiere `PROFILE_WRITE` y una fila seleccionada | `btn-edit`    |
| Eliminar     | Requiere `PROFILE_WRITE` y una fila seleccionada | `btn-delete`  |
| Exportar CSV | Siempre disponible                               | `btn-export`  |

- La selección de una fila alterna (seleccionar / deseleccionar).
- El detalle se abre pulsando el botón *Detalle* con una fila seleccionada o mediante doble clic sobre la fila.
- La exportación a CSV incluye **todos los registros que cumplen los filtros activos**, no solo la página actual.

### 2.4. Identificadores para pruebas (`data-testid`)

| Elemento              | `data-testid`          |
|-----------------------|------------------------|
| Formulario de filtros | `profiles-filter-form` |
| Filtro de nombre      | `filter-name`          |
| Tabla de perfiles     | `profiles-table`       |
| Botón Detalle         | `btn-detail`           |
| Botón Crear           | `btn-create`           |
| Botón Editar          | `btn-edit`             |
| Botón Eliminar        | `btn-delete`           |
| Botón Exportar CSV    | `btn-export`           |

### 2.5. Formulario de perfil

**Campos:**

| Campo              | Obligatorio | Notas                                                                |
|--------------------|-------------|----------------------------------------------------------------------|
| Nombre             | Sí          | Requerido en alta y edición                                          |
| Descripción        | No          | Texto libre opcional                                                 |
| Acciones asignadas | No          | Multi-selección de acciones a través de `TpSelectedActionsComponent` |

**Información de auditoría** (solo en modo detalle, solo lectura): fecha de creación y última modificación.

### 2.6. Validaciones funcionales

| Campo       | Regla                                     |
|-------------|-------------------------------------------|
| Nombre      | Obligatorio                               |
| Descripción | Opcional                                  |
| Acciones    | Deben ser únicas y existir en el catálogo |

### 2.7. Diagramas

#### 2.7.1. Flujo de operaciones CRUD

```mermaid
flowchart TD
  A["Listado de perfiles"] --> B{"Accion"}
  B -->|Crear| C["Formulario en modo create"]
  B -->|Editar| D["Formulario en modo edit"]
  B -->|Eliminar| E["Modal de confirmación"]
  B -->|Detalle o doble clic| F["Detalle en modo view"]
  C --> G["Guardar"]
  D --> G
  G --> H{"Operación correcta"}
  H -->|Sí| I["Notificación de éxito y refresco del listado"]
  H -->|No| J["Notificación de error"]
  E --> K{"Confirmar"}
  K -->|Sí| L["Elimina y refresca el listado"]
  K -->|No| A
```

### 2.8. Mensajes y notificaciones

- Las operaciones de crear, editar, eliminar, exportar y paginar muestran notificaciones de progreso, éxito o error mediante el `NotificationService` (claves `notification.*`).
- La eliminación solicita confirmación mediante un modal con el mensaje `profiles.delete.confirmMessage`, que incluye el nombre del perfil y advierte de que la acción no se puede deshacer.

---

## 3. Parte técnica

### 3.1. Componentes afectados

| Capa     | Elemento                     | Responsabilidad                                                                 |
|----------|------------------------------|---------------------------------------------------------------------------------|
| Frontend | `ProfileListComponent`       | Listado, filtros, paginación, orden, exportación y orquestación de vistas.      |
| Frontend | `ProfileFormComponent`       | Alta, edición y detalle de un perfil.                                           |
| Frontend | `ProfileService`             | Llamadas CRUD y carga de referencias de acciones asociadas.                     |
| Frontend | `TpDataTableComponent`       | Tabla reutilizable para ordenación, paginación y selección.                     |
| Frontend | `TpSelectedActionsComponent` | Selección multi-acción del perfil en el formulario.                             |
| Frontend | `AuthService`                | Comprobación de permisos del usuario antes de acceder al módulo.                |
| Backend  | `ProfileController`          | Exposición de endpoints CRUD y de referencias de perfiles.                      |
| Backend  | `ProfileService`             | Lógica de negocio, validaciones y persistencia del perfil.                      |
| Domain   | `Profile`                    | Entidad principal del rol de usuario y asociación con acciones.                 |
| Domain   | `Action`                     | Entidad de permisos que se vincula al perfil mediante relación muchos a muchos. |
| Security | `SecurityConfig`             | Reglas de autorización y protección de rutas del módulo de perfiles.            |

### 3.2. Modelos de datos

#### Frontend (TypeScript)

```typescript
interface Profile {
  id: number | null;
  name: string;
  description: string | null;
  actions?: Action[];
  actionIds?: number[];
  createdAt?: string | null;
  lastModifiedAt?: string | null;
}

interface ProfileCriteria {
  name?: string;
}
```

#### Backend DTOs (Java)

```java
public record ProfileDTO(
    Long id,
    String name,
    String description,
    List<Long> actionIds,
    OffsetDateTime createdAt,
    OffsetDateTime lastModifiedAt
) {}

public record ProfileCriteria(
    String name
) {}
```

#### Entidades JPA

```java
@Entity
@Table(name = "profile")
public class Profile extends BaseEntity {
    @Column(nullable = false, unique = true)
    private String name;

    private String description;

    @ManyToMany
    @JoinTable(
        name = "profile_action",
        joinColumns = @JoinColumn(name = "profile_id"),
        inverseJoinColumns = @JoinColumn(name = "action_id")
    )
    private List<Action> actions = new ArrayList<>();
}
```

### 3.3. Endpoints

Ruta base: `/api/v1/administration/security/profiles`.

| Método y ruta     | Descripción                                             | Respuesta                        |
|-------------------|---------------------------------------------------------|----------------------------------|
| `GET /references` | Lista ligera de perfiles para selectores (`id`, `name`) | 200 OK con lista de referencias  |
| `GET /`           | Listado paginado con filtros (`name`) y `Pageable`      | 200 OK con página de perfiles    |
| `GET /count`      | Número de perfiles que cumplen los filtros              | 200 OK con el total              |
| `GET /{id}`       | Perfil por identificador                                | 200 OK con el perfil             |
| `POST /`          | Alta de perfil (`id` nulo)                              | 201 Created con el perfil creado |
| `PUT /{id}`       | Actualización de perfil                                 | 200 OK con el perfil actualizado |
| `DELETE /{id}`    | Eliminación de perfil                                   | 204 No Content                   |

Datos de referencia consumidos por el formulario:

- Acciones: `GET /api/v1/administration/security/actions` (o la referencia equivalente de acciones del sistema)

### 3.4. Validaciones

- El nombre del perfil es obligatorio y debe cumplir la regla de unicidad en el catálogo de perfiles.
- La descripción es opcional, pero si se informa debe cumplir la longitud y el formato requerido por el backend.
- La relación con acciones debe referenciar IDs válidos que existan en el catálogo de permisos.
- La operación de borrado se rechaza si el perfil está asociado a usuarios activos o si el backend detecta un uso en curso (`EntityInUseException`).

### 3.5. Exportación

- El botón de exportación funciona igual que en el resto de pantallas del módulo: está siempre disponible y exporta la totalidad de registros que cumplen los filtros activos.
- Para construir el CSV se reutiliza la misma consulta del listado contra los mismos métodos backend (`GET /` y `GET /count`) con los filtros activos.
- La exportación incluye **todos los registros que cumplen los filtros activos**, no solo la página visible en pantalla.
- Si no existen filas coincidentes, la UI informa del caso y evita generar un archivo vacío.

### 3.6. Paginación, orden y filtros

- La paginación y el orden se envían como parámetros `page`, `size` y `sort` (formato `campo,dirección`).
- El filtro de nombre se envía solo si existe valor no vacío.
- La ordenación de la columna `actions` se resuelve en cliente, porque es un contador derivado de la relación y no existe como propiedad JPA ordenable del backend.

### 3.7. Seguridad y permisos

- El acceso a la administración de perfiles se protege en `SecurityConfig` con `GET /api/v1/administration/security/profiles/**` usando `hasAnyAuthority("PROFILE_READ", "PROFILE_WRITE")`, y `POST/PUT/DELETE` con `hasAuthority("PROFILE_WRITE")`.
- El endpoint `GET /references` se habilita con cualquiera de `USER_READ`, `USER_WRITE`, `PROFILE_READ` o `PROFILE_WRITE`, porque se usa como catálogo de selección para formularios y filtros.
- Las acciones de crear, editar y eliminar solo se muestran si el usuario posee la acción `PROFILE_WRITE` (`canWrite`).
- Cuando se intenta borrar un perfil con usuarios asociados, el backend lanza una excepción de tipo `EntityInUseException` y la operación se rechaza.
- La duplicación de acciones dentro de un perfil se valida en backend para evitar inconsistencias de permisos.

### 3.8. Reglas de comportamiento relevantes

- En creación y edición, el formulario admite nombre, descripción y selección de acciones.
- En detalle, el formulario pasa a modo de solo lectura y muestra la auditoría.
- Al guardar, el payload se envía como `{ id, name, description, actionIds }`.
- En edición, la lista de acciones se reemplaza completa, no se fusiona.
- Tras crear o actualizar con éxito, la aplicación vuelve al listado y lo recarga.
- La eliminación es irreversible y siempre requiere confirmación explícita del usuario.

---

## 4. Pruebas

### 4.1. Cobertura unitaria (backend)

La suite actual incluye pruebas del servicio y del controlador que cubren el CRUD, validaciones de negocio y la relación con las acciones asignadas:

| Ubicación                                                                                                | Alcance                                                                                                                        |
|----------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------|
| `template/core/src/test/java/org/myorganization/template/core/service/ProfileServiceTest.java`           | Alta, consulta, búsqueda por criterios, actualización, borrado, validación de acciones duplicadas y gestión de perfiles en uso |
| `template/webapp/src/test/java/org/myorganization/template/webapp/controller/ProfileControllerTest.java` | Respuestas HTTP de los endpoints, filtros y propagación de excepciones del servicio                                            |

Estas pruebas cubren la lógica principal del módulo y complementan la validación E2E del frontend.

### 4.2. Cobertura unitaria (frontend)

| Ubicación                        | Alcance                                           |
|----------------------------------|---------------------------------------------------|
| `profile-list.component.spec.ts` | Estado de listado, filtros, paginación y acciones |
| `profile-form.component.spec.ts` | Modos del formulario y emisión de eventos         |
| `profile.service.spec.ts`        | Construcción de peticiones CRUD y parámetros      |

### 4.3. Cobertura E2E (Playwright)

Ubicación: `dashboard/e2e/tests/administration/profiles.spec.ts` (Page Object en `dashboard/e2e/pages/profiles.page.ts`).

| Caso              | Descripción                                           | Resultado esperado                                                                   |
|-------------------|-------------------------------------------------------|--------------------------------------------------------------------------------------|
| Listar perfiles   | Acceder a la pantalla tras iniciar sesión             | La tabla es visible, hay al menos una fila y se muestran filtros y el botón de crear |
| Buscar por nombre | Filtrar por un nombre existente y por uno inexistente | El listado muestra la fila coincidente; con un término sin coincidencias queda vacío |
| Crear perfil      | Alta desde el formulario con datos válidos            | El backend responde 201, se vuelve al listado y el nuevo perfil aparece al buscarlo  |
| Editar perfil     | Seleccionar un perfil y modificar sus datos           | El backend responde 200 y el cambio se refleja en el listado                         |
| Eliminar perfil   | Seleccionar un perfil y confirmar el borrado          | El backend responde 204 y el perfil deja de aparecer al buscarlo                     |
| Exportar CSV      | Pulsar el botón de exportar                           | El navegador descarga el fichero `profiles_YYYY-MM-DD.csv`                           |

- Cada test inicia sesión con un usuario administrador (acciones `PROFILE_READ` y `PROFILE_WRITE`) y navega directamente a `/administration/security/profiles`.
- Los casos de creación y edición insertan un registro en el backend por ejecución; el caso de eliminación borra el perfil que él mismo crea.
- La exportación a CSV depende de que existan filas que cumplan los filtros activos; en caso contrario se notifica que no hay datos que exportar.

### 4.4. Datos de prueba

Definidos en `dashboard/e2e/fixtures/test-data.ts`: `testProfiles.valid` y helpers para crear perfiles con nombre único por ejecución.

### 4.5. Dependencias de ejecución

- Los casos E2E de listar, buscar, crear, editar, eliminar y exportar requieren el backend de integración levantado (por defecto en `http://localhost:8080`).
- Los casos de creación y edición insertan un registro en el backend por ejecución; el caso de eliminación borra el perfil que él mismo crea.
- La exportación a CSV depende de que existan filas que cumplan los filtros activos; en caso contrario se notifica que no hay datos que exportar.

### 4.6. Casos de prueba detallados (TCY-PRO)

Catálogo de test cases derivado de los requisitos funcionales de perfiles (`RF-PRO-*`, `RNF-PRO-*`). Para el marco global de pruebas, variables (`{{BASE_URL_UI}}`, `{{BASE_URL_API}}`, `{{ADMIN_USER}}`, `{{UNIQUE}}`) y modelo de ejecución, consultar el [Plan Maestro de Pruebas](../../../specification/test-case.md).

Precondición del ciclo: usuario con `PROFILE_READ` y `PROFILE_WRITE`. Datos de alta tomados de `buildNewProfile()`: nombre `e2e_profile_{{UNIQUE}}`, descripción `Perfil de prueba {{UNIQUE}}`. Cada caso que crea un perfil lo elimina en el teardown.

#### TC-PRO-01 · Listado paginado y ordenable

- **Versión:** 1.0 · **Prioridad:** Alta · **Tipo:** Funcional · **Traza:** RF-PRO-1 (AC1.1–AC1.3) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`.
- **Teardown:** logout.

| # | Acción                                                       | Resultado esperado                                                                   |
|---|--------------------------------------------------------------|--------------------------------------------------------------------------------------|
| 1 | Navegar a `{{BASE_URL_UI}}/administration/security/profiles` | `profiles-table` visible con nombre, descripción, nº de acciones y fecha de creación |
| 2 | Ordenar por una columna y paginar                            | La ordenación y la paginación funcionan                                              |

#### TC-PRO-02 · Búsqueda por nombre

- **Versión:** 1.0 · **Prioridad:** Media · **Tipo:** Funcional · **Traza:** RF-PRO-2 (AC2.1–AC2.3) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`; existe el perfil semilla `ADMIN`.
- **Teardown:** logout.

| # | Acción                                     | Resultado esperado                                        |
|---|--------------------------------------------|-----------------------------------------------------------|
| 1 | Escribir `ADMIN` en `filter-name` y buscar | Muestra la fila del perfil `ADMIN` y vuelve a la página 1 |
| 2 | Escribir `zzz_inexistente` y buscar        | Listado vacío                                             |
| 3 | Limpiar                                    | Recarga el listado completo                               |

#### TC-PRO-03 · Alta de perfil con acciones

- **Versión:** 1.0 · **Prioridad:** Alta · **Tipo:** Funcional, E2E · **Traza:** RF-PRO-3 (AC3.1–AC3.4), RNF-PRO-3 · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`; catálogo de acciones disponible.
- **Teardown:** eliminar el perfil `e2e_profile_{{UNIQUE}}`.

| # | Acción                                                                                                        | Resultado esperado                                                      |
|---|---------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------|
| 1 | Pulsar `btn-create`, informar nombre `e2e_profile_{{UNIQUE}}`, descripción y seleccionar 2 acciones distintas | Formulario válido                                                       |
| 2 | Guardar                                                                                                       | El backend responde 201; el perfil aparece al buscarlo                  |
| 3 | Comprobar la integridad                                                                                       | El perfil no admite acciones duplicadas (el backend rechaza duplicados) |

#### TC-PRO-04 · Edición de perfil (reemplazo de acciones)

- **Versión:** 1.0 · **Prioridad:** Alta · **Tipo:** Funcional, E2E · **Traza:** RF-PRO-4 (AC4.1–AC4.3) · **Independiente:** Sí (crea su propio perfil) · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`; crear previamente `e2e_profile_{{UNIQUE}}`.
- **Teardown:** eliminar `e2e_profile_{{UNIQUE}}`.

| # | Acción                                                                              | Resultado esperado                                                                                      |
|---|-------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| 1 | Seleccionar `e2e_profile_{{UNIQUE}}` y pulsar `btn-edit`                            | Formulario en modo edición                                                                              |
| 2 | Cambiar la descripción y reemplazar la lista de acciones por otra distinta, guardar | 200 OK; la lista de acciones se reemplaza completa (no se fusiona) y el cambio se refleja en el listado |

#### TC-PRO-05 · Eliminación con confirmación

- **Versión:** 1.0 · **Prioridad:** Alta · **Tipo:** Funcional, E2E · **Traza:** RF-PRO-5 (AC5.1–AC5.3) · **Independiente:** Sí (crea su propio perfil) · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`; crear `e2e_profile_{{UNIQUE}}` sin usuarios asociados.
- **Teardown:** si queda tras un fallo, eliminarlo por API.

| # | Acción                                                                | Resultado esperado                    |
|---|-----------------------------------------------------------------------|---------------------------------------|
| 1 | Seleccionar `e2e_profile_{{UNIQUE}}` y pulsar `btn-delete` → cancelar | No se elimina                         |
| 2 | Repetir y confirmar                                                   | 204; el perfil desaparece al buscarlo |

#### TC-PRO-06 · Eliminación de perfil en uso

- **Versión:** 1.0 · **Prioridad:** Alta · **Tipo:** Negativo · **Traza:** RF-PRO-5 (AC5.4) · **Independiente:** Sí · **Dependencias:** ninguna (usa un perfil semilla asignado a usuarios, p. ej. `ADMIN`)
- **Setup:** login con `{{ADMIN_USER}}`; identificar un perfil asignado a al menos un usuario (`ADMIN`).
- **Teardown:** logout (no se elimina nada).

| # | Acción                                                            | Resultado esperado                                                                        |
|---|-------------------------------------------------------------------|-------------------------------------------------------------------------------------------|
| 1 | Seleccionar el perfil `ADMIN` (en uso) y confirmar su eliminación | El backend devuelve `EntityInUseException`; la operación se rechaza y el perfil permanece |

#### TC-PRO-07 · Detalle de perfil

- **Versión:** 1.0 · **Prioridad:** Media · **Tipo:** Funcional · **Traza:** RF-PRO-6 (AC6.1–AC6.3) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`.
- **Teardown:** logout.

| # | Acción                             | Resultado esperado                                                                                |
|---|------------------------------------|---------------------------------------------------------------------------------------------------|
| 1 | Doble clic sobre el perfil `ADMIN` | Detalle en solo lectura con datos generales, acciones asignadas y fechas de creación/modificación |

#### TC-PRO-08 · Exportación CSV

- **Versión:** 1.0 · **Prioridad:** Media · **Tipo:** Funcional, E2E · **Traza:** RF-PRO-7 (AC7.1–AC7.3) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`.
- **Teardown:** eliminar el fichero descargado; logout.

| # | Acción                                   | Resultado esperado                                                  |
|---|------------------------------------------|---------------------------------------------------------------------|
| 1 | Sin filtros, pulsar `btn-export`         | Descarga `profiles_{{TODAY}}.csv` con todos los registros filtrados |
| 2 | Filtrar por `zzz_inexistente` y exportar | Notifica que no hay datos; sin descarga                             |

#### TC-PRO-09 · Autorización y endpoint de referencias

- **Versión:** 1.0 · **Prioridad:** Alta · **Tipo:** Seguridad, API · **Traza:** RNF-PRO-1, RNF-PRO-2 · **Independiente:** Sí · **Dependencias:** requiere tokens con distintos permisos
- **Setup:** vía API. Preparar: (a) token sin `PROFILE_READ`; (b) token con `PROFILE_READ` sin `PROFILE_WRITE`; (c) token con `USER_READ`.
- **Teardown:** eliminar usuarios/perfiles de prueba.

| # | Acción                                                                                        | Resultado esperado                                                                   |
|---|-----------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------|
| 1 | Con token sin `PROFILE_READ`, `GET /api/v1/administration/security/profiles`                  | 403 Forbidden                                                                        |
| 2 | Con token `PROFILE_READ` sin `PROFILE_WRITE`, abrir el listado en UI y luego `POST /profiles` | Botones crear/editar/eliminar ocultos; el POST responde 403                          |
| 3 | Con token `USER_READ`, `GET /api/v1/administration/security/profiles/references`              | 200 OK (el endpoint de referencias se permite al consumidor del listado de usuarios) |

---

## Referencias

- [Plan Maestro de Pruebas](../../../specification/test-case.md)
- [Requisitos](../../../specification/requirements.md)
- [Glosario](../../../specification/glossary.md)
- [Modelo de datos](../../../specification/data-model.md)
- [Módulo Seguridad](./security.md)
- [Autenticación y Gestión de Sesión](../../login/authentication.md)
- [Seguridad (backend)](../../../03-technical/backend/security.md)
- [API (backend)](../../../03-technical/backend/api.md)
- [Diseño (frontend)](../../../03-technical/frontend/design-system.md)
