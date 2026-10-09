# Casos de Prueba (Test Cases y Test Cycles)

Catálogo de **test cycles** y **test cases** derivado de la documentación funcional (`02-functional/`), diseñado para que **cualquier ejecutor** —una persona, una IA o un proceso automático— pueda ejecutar cada caso de principio a fin sin conocimiento previo del sistema, y para dar de alta en un gestor de pruebas tipo **Jira** (Xray / Zephyr) u **OpenProject**.

Cada test case:

- Es **autocontenido**: incluye su precondición, los datos exactos a usar, los pasos accionables y la limpieza posterior.
- Declara su **independencia**: la mayoría son independientes y se autoabastecen (crean sus propios datos). Cuando un caso depende de otro, se indica de forma explícita en el campo *Dependencias*.
- Está **trazado** a los requisitos funcionales (`RF-*`) y no funcionales (`RNF-*`) del documento de origen.

## Cómo ejecutar los casos (cualquier actor)

### Modelo de ejecución de cada caso

Cada test case se estructura en cuatro bloques fijos para que un ejecutor automático pueda parsearlo:

1. **Metadatos:** prioridad, tipo, trazabilidad, independencia y dependencias.
2. **Precondición / Setup:** estado que debe existir antes de empezar. Si el caso lo crea él mismo, se indica como *autoabastecido*.
3. **Pasos:** tabla `# | Acción | Resultado esperado`. Cada acción es inequívoca: una URL a navegar, un `data-testid` a pulsar, o una petición HTTP con método, ruta y cuerpo. Cada resultado esperado es una aserción verificable (texto visible, estado HTTP, URL destino).
4. **Teardown:** limpieza para dejar el sistema como estaba (borrar lo creado, cerrar sesión). Si no genera residuos, se indica *No aplica*.

### Dos vías de ejecución

Los casos admiten dos formas de ejecución; cada paso indica implícitamente la vía por el tipo de acción:

- **Vía UI (persona o agente de navegador):** acciones del tipo "navegar a `<ruta>`", "pulsar `<data-testid>`", "rellenar `<campo>`". Los selectores son los `data-testid` reales de cada pantalla (listados en la documentación funcional de origen).
- **Vía API (proceso automático / IA):** acciones del tipo "invocar `<MÉTODO> <ruta>`". Útil para precondiciones, verificaciones de seguridad y teardown sin pasar por la UI.

Un caso marcado como `E2E` se recomienda ejecutar por UI; uno marcado `API` o `Seguridad`, por API. Los `Funcional` pueden ejecutarse por cualquiera de las dos vías.

### Variables de entorno (parametrizar antes de ejecutar)

Para no fijar valores de un entorno concreto, los casos usan estas variables. Sustitúyelas por los valores reales antes de ejecutar:

| Variable | Descripción | Valor de referencia (perfil `test`) |
|----------|-------------|--------------------------------------|
| `{{BASE_URL_UI}}` | URL base del frontend | `http://localhost:4200` |
| `{{BASE_URL_API}}` | URL base del backend | `http://localhost:8080` |
| `{{ADMIN_USER}}` | Usuario administrador (todas las acciones) | `admin` |
| `{{ADMIN_PASS}}` | Contraseña del administrador | `admin123` |
| `{{TODAY}}` | Fecha actual en formato `YYYY-MM-DD` | (fecha del día de ejecución) |
| `{{UNIQUE}}` | Sufijo único por ejecución (p. ej. timestamp) | `20260409_173000` |

Credenciales y helpers de datos tomados de `template/dashboard/e2e/fixtures/test-data.ts` (`testUsers.valid`, `buildNewUser`, `buildNewProfile`, `buildNewParameter`).

### Datos únicos y repetibilidad

Los casos que crean entidades usan `{{UNIQUE}}` en nombres/códigos (p. ej. `e2e_user_{{UNIQUE}}`) para poder reejecutarse contra el mismo backend sin colisiones. El teardown elimina lo creado; si un caso falla antes del teardown, el sufijo único garantiza que una reejecución no choque con el residuo.

### Precondición global

Salvo que un caso indique lo contrario:

- Backend de integración levantado en `{{BASE_URL_API}}` (perfil `test`) y base de datos con datos semilla cargados.
- Frontend servido en `{{BASE_URL_UI}}` (solo para la vía UI).
- Para la vía API, obtener primero un access token: `POST {{BASE_URL_API}}/api/v1/auth/login` con `{ "username": "{{ADMIN_USER}}", "password": "{{ADMIN_PASS}}" }` y usar el `accessToken` devuelto como `Authorization: Bearer <token>`.

## Resumen de Test Cycles

| ID Ciclo | Nombre | Módulo | Nº casos | Estado | Documento origen |
|----------|--------|--------|----------|--------|------------------|
| TCY-LOGIN | Autenticación y acceso | Login | 11 | Activo | `login/login.md`, `login/authentication.md` |
| TCY-RPT | Informes | Informes | 10 | Activo | `reports/reports.md` |
| TCY-USR | Gestión de usuarios | Administración · Seguridad | 10 | Activo | `administration/security/users.md` |
| TCY-PRO | Gestión de perfiles | Administración · Seguridad | 9 | Activo | `administration/security/profiles.md` |
| TCY-ACC | Catálogo de acciones | Administración · Seguridad | 7 | Activo | `administration/security/actions.md` |
| TCY-PAR | Parámetros | Administración | 9 | Activo | `administration/parameters/parameters.md` |
| TCY-AUD | Auditoría | Administración | 7 | Activo (1 caso 🔴 bloqueado: TC-AUD-03) | `administration/audit/audit.md` |
| TCY-IFM | Monitor de interfaces | Interfaces | 8 | Activo | `interfaces/monitor/monitor.md` |
| TCY-CFG | Configuración de interfaces | Interfaces | 6 | Activo | `interfaces/configuration/configuration.md` |
| TCY-CLN | Nodos del cluster | Administración · Cluster | 7 | Activo | `administration/cluster/cluster-nodes.md` |
| TCY-CLB | Bloqueos del cluster | Administración · Cluster | 5 | Activo | `administration/cluster/cluster-blocks.md` |

### Convención de independencia

- **Independiente:** el caso se ejecuta por sí solo (login propio incluido) sin requerir que otro caso se haya ejecutado antes. Es la norma general.
- **Depende de:** se lista el ID del caso del que depende y por qué. Un ejecutor automático debe programar primero la dependencia.

### Convención de estado

- Un caso sin campo *Estado* se considera **Activo**: listo para ejecutar.
- Un caso con **Estado: 🔴 BLOQUEADO** no debe ejecutarse: hay una revisión funcional o técnica pendiente que impide validarlo de extremo a extremo. El caso documenta el *motivo del bloqueo* y la *condición para desbloquear*. Un ejecutor automático debe **omitir** (skip) estos casos y reportarlos como no ejecutados, no como fallidos.

Dentro de un mismo ciclo, cada caso hace su **propio login** y su **propia limpieza**, por lo que el orden de ejecución no importa salvo donde se declare lo contrario.

---

## TCY-LOGIN · Autenticación y acceso

Fuente: `02-functional/login/login.md` (`RF-LOG-*`, `RNF-LOG-*`) y `02-functional/login/authentication.md` (`RF-AUT-*`, `RNF-AUT-*`).

### TC-LOG-01 · Render del formulario de login

- **Prioridad:** Media · **Tipo:** UI · **Traza:** RF-LOG-2 · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** navegador sin sesión activa (sin cookie de refresh). Si hubiera sesión, ejecutar logout o abrir ventana privada.
- **Teardown:** No aplica (no modifica estado).

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Navegar a `{{BASE_URL_UI}}/login` | Carga la pantalla de login |
| 2 | Comprobar elementos | Son visibles `login-title`, `input-username`, `input-password` y `btn-login-submit` |
| 3 | Comprobar selector de idioma | Está presente el control `btn-lang-<lang>` |

### TC-LOG-02 · Login con credenciales válidas

- **Prioridad:** Alta · **Tipo:** Funcional, E2E · **Traza:** RF-LOG-1 (AC1.1–AC1.3), RF-AUT-1 · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** usuario `{{ADMIN_USER}}` existe en el entorno (dato semilla). Navegador sin sesión.
- **Teardown:** ejecutar logout para no dejar sesión abierta.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Navegar a `{{BASE_URL_UI}}/login` | Pantalla de login visible |
| 2 | Rellenar `input-username` = `{{ADMIN_USER}}` y `input-password` = `{{ADMIN_PASS}}` | Campos informados |
| 3 | Pulsar `btn-login-submit` | Se invoca `POST {{BASE_URL_API}}/api/v1/auth/login`; responde 200 con `accessToken` en el body y `Set-Cookie` con el refresh token |
| 4 | Esperar navegación | La URL pasa a `{{BASE_URL_UI}}/dashboard` y se muestra `dashboard-title` |

### TC-LOG-03 · Login con credenciales inválidas

- **Prioridad:** Alta · **Tipo:** Negativo · **Traza:** RF-LOG-3 (AC3.1–AC3.3), RF-AUT-1 (AC1.2) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** navegador sin sesión.
- **Teardown:** No aplica.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Navegar a `{{BASE_URL_UI}}/login` | Pantalla de login visible |
| 2 | Rellenar `input-username` = `{{ADMIN_USER}}` y `input-password` = `wrong-password` | Campos informados |
| 3 | Pulsar `btn-login-submit` | El backend responde 401 sin establecer cookie |
| 4 | Observar la pantalla | Se muestra `login-error-alert` con el texto de `login.error`; la URL sigue siendo `/login` |

### TC-LOG-04 · Validación de campos obligatorios

- **Prioridad:** Media · **Tipo:** Negativo · **Traza:** RF-LOG-2 (AC2.1–AC2.3) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** navegador sin sesión.
- **Teardown:** No aplica.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Navegar a `{{BASE_URL_UI}}/login` | Pantalla de login visible |
| 2 | Dejar `input-username` e `input-password` vacíos y pulsar `btn-login-submit` | No se realiza ninguna llamada a `/api/v1/auth/login` |
| 3 | Observar los campos | Se marcan como tocados y muestran el error `validation.required`; la URL sigue en `/login` |

### TC-LOG-05 · Mostrar / ocultar contraseña

- **Prioridad:** Baja · **Tipo:** UI · **Traza:** RF-LOG-5 (AC5.1–AC5.2) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** navegador sin sesión.
- **Teardown:** No aplica.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Navegar a `{{BASE_URL_UI}}/login` y escribir en `input-password` el texto `secreto123` | El campo es de tipo `password` (valor oculto) |
| 2 | Pulsar `btn-toggle-password` | El input pasa a tipo `text` y muestra `secreto123` |
| 3 | Pulsar de nuevo `btn-toggle-password` | Vuelve a tipo `password` conservando `secreto123` |

### TC-LOG-06 · Control de envío (evitar duplicados)

- **Prioridad:** Media · **Tipo:** Funcional · **Traza:** RF-LOG-4 (AC4.1–AC4.2) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** navegador sin sesión; usuario `{{ADMIN_USER}}` válido.
- **Teardown:** si el login llega a completarse, ejecutar logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Navegar a `{{BASE_URL_UI}}/login` y rellenar credenciales válidas | Campos informados |
| 2 | Pulsar `btn-login-submit` y observar el botón durante la petición | El botón `btn-login-submit` queda deshabilitado y muestra estado de carga mientras dura la llamada |

### TC-LOG-07 · Selección de idioma en login

- **Prioridad:** Baja · **Tipo:** UI · **Traza:** RF-LOG-6 (AC6.1–AC6.2) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** navegador sin sesión.
- **Teardown:** restablecer idioma a ES (pulsar `btn-lang-es`) para dejar el estado por defecto.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Navegar a `{{BASE_URL_UI}}/login` | Textos en el idioma por defecto |
| 2 | Pulsar `btn-lang-en` | Los textos del login cambian a inglés sin recargar la página |
| 3 | Pulsar `btn-lang-es` | Los textos vuelven a español sin recargar |

### TC-LOG-08 · Persistencia de sesión tras recarga

- **Prioridad:** Alta · **Tipo:** Funcional · **Traza:** RF-AUT-2 (AC2.1, AC2.4, AC2.5) · **Independiente:** Sí · **Dependencias:** ninguna (incluye su propio login)
- **Setup:** navegador sin sesión; usuario `{{ADMIN_USER}}` válido.
- **Teardown:** ejecutar logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Iniciar sesión con `{{ADMIN_USER}}` / `{{ADMIN_PASS}}` | Sesión activa en `/dashboard` |
| 2 | Recargar la página (F5) | Al arrancar, se invoca `POST /api/v1/auth/refresh`; con refresh token válido se restaura la sesión sin pedir credenciales |
| 3 | Observar la URL | Permanece en `/dashboard` (no redirige a `/login`) |

### TC-LOG-09 · Renovación automática del access token

- **Prioridad:** Alta · **Tipo:** Funcional · **Traza:** RF-AUT-3 (AC3.1–AC3.4), RNF-AUT-6 · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** sesión iniciada; conviene reducir `jwt.access-token-expiration` y/o ajustar `tokenRefreshMargin` en el entorno de prueba para observar la renovación en un tiempo razonable.
- **Teardown:** ejecutar logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Mantener la sesión hasta que el access token esté próximo a expirar (margen `tokenRefreshMargin`) | El interceptor dispara `POST /api/v1/auth/refresh` de forma proactiva |
| 2 | Lanzar varias peticiones a la API en ese instante (p. ej. abrir dos listados a la vez) | Solo una ejecuta el refresh; las demás esperan su resultado (sin múltiples llamadas) |
| 3 | Inspeccionar la cookie de refresh | Se ha generado un nuevo refresh token (rotación) y el anterior queda invalidado |

### TC-LOG-10 · Logout invalida la sesión en cliente y servidor

- **Prioridad:** Alta · **Tipo:** Seguridad · **Traza:** RF-AUT-4 (AC4.1–AC4.6) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** sesión iniciada con `{{ADMIN_USER}}`.
- **Teardown:** No aplica (el propio caso deja la sesión cerrada).

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Con sesión activa, ejecutar logout desde la UI | Se invoca `POST /api/v1/auth/logout`; el servidor revoca los refresh tokens y envía `Set-Cookie maxAge=0` |
| 2 | Observar el cliente | El access token ya no está en memoria y `currentUser` queda a null; redirección a `/login` |
| 3 | Invocar `POST {{BASE_URL_API}}/api/v1/auth/refresh` reutilizando la cookie anterior | Responde 401 |
| 4 | Intentar navegar a `{{BASE_URL_UI}}/dashboard` | Redirige a `/login` |

### TC-LOG-11 · Reutilización de refresh token revocado (detección de robo)

- **Prioridad:** Alta · **Tipo:** Seguridad · **Traza:** RF-AUT-5 (AC5.4), RF-AUT-3 (AC3.5) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** vía API. Hacer login y capturar la cookie de refresh inicial (`RT0`).
- **Teardown:** ejecutar logout para revocar cualquier token vivo.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | `POST {{BASE_URL_API}}/api/v1/auth/refresh` con la cookie `RT0` | 200 OK; se emite un nuevo refresh token `RT1` y `RT0` queda revocado (rotación) |
| 2 | Repetir `POST .../auth/refresh` con la cookie `RT0` (ya revocada) | El servidor revoca **todos** los refresh tokens del usuario (revocación masiva) y responde con error de autorización |
| 3 | `POST .../auth/refresh` con `RT1` | También falla (401/403), porque la revocación masiva invalidó toda la cadena |

---

## TCY-RPT · Informes

Fuente: `02-functional/reports/reports.md` (`RF-RPT-*`, `RNF-RPT-*`). Precondición del ciclo: usuario con `REPORT_EXECUTE` y al menos un informe asignado vía `user2report` (seed `20250117-seed-local-reports.xml`); el informe de referencia es el de id `1` ("Informe de actividad mensual"). Cada caso incluye su propio login con `{{ADMIN_USER}}`.

### TC-RPT-01 · Carga de metadatos y filtros sin ejecución automática

- **Prioridad:** Alta · **Tipo:** Funcional · **Traza:** RF-RPT-1 (AC1.1–AC1.3) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`; el usuario tiene asignado el informe `1`.
- **Teardown:** logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Navegar a `{{BASE_URL_UI}}/reports/1` | Cabecera con `report.name` y `report.description` visibles |
| 2 | Observar la barra de filtros (`report-filter-form`) | Se renderiza un control por filtro según su `type` (TEXT/NUMBER → input, DATE → input date, SELECT → select con opción `common.all`) |
| 3 | Observar la tabla y la barra de exportación | `report-results-table` y los botones `report-export-*` permanecen ocultos hasta pulsar *Ejecutar* |

### TC-RPT-02 · Informe no asignado al usuario

- **Prioridad:** Media · **Tipo:** Negativo, Seguridad · **Traza:** RF-RPT-1 (AC1.4), RNF-RPT-1 · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`; identificar un `id` de informe **no** asignado al usuario (p. ej. uno inexistente o no relacionado en `user2report`).
- **Teardown:** logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Navegar a `{{BASE_URL_UI}}/reports/<id-no-asignado>` | `findByUser` no devuelve el informe; el componente queda con `report = null` (sin cabecera ni posibilidad de ejecución) |

### TC-RPT-03 · Validación de filtros obligatorios

- **Prioridad:** Alta · **Tipo:** Negativo · **Traza:** RF-RPT-2 (AC2.2, AC2.4), RNF-RPT-2 · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`; informe `1` con al menos un filtro `required=true`.
- **Teardown:** logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Navegar a `{{BASE_URL_UI}}/reports/1` y dejar vacío un filtro `required=true` | El filtro se marca con asterisco rojo y atributo HTML5 `required` |
| 2 | Pulsar `report-execute-btn` | El submit HTML5 bloquea la ejecución; no se envía `/execute`. (Si la validación se saltara, el backend respondería `ValidationException` con los filtros faltantes.) |

### TC-RPT-04 · Limpiar filtros

- **Prioridad:** Media · **Tipo:** Funcional · **Traza:** RF-RPT-2 (AC2.3) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`.
- **Teardown:** logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Navegar a `{{BASE_URL_UI}}/reports/1`, rellenar filtros y pulsar `report-execute-btn` | Se muestran resultados en `report-results-table` |
| 2 | Pulsar `report-clear-btn` | Todos los filtros vuelven a `''`, los resultados se resetean, la paginación vuelve a página 0 y se ocultan la tabla y la barra de exportación |

### TC-RPT-05 · Ejecución con paginación en servidor

- **Prioridad:** Alta · **Tipo:** Funcional, E2E · **Traza:** RF-RPT-3 (AC3.1–AC3.5) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`; informe `1` con datos.
- **Teardown:** logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Navegar a `{{BASE_URL_UI}}/reports/1`, rellenar los filtros obligatorios (si los hay) y pulsar `report-execute-btn` | Se invoca `POST /api/v1/reports/1/execute?page=0&size=10` con el body de filtros; se muestra spinner y `notification.progress` |
| 2 | Observar los resultados | `report-results-table` muestra columnas y filas de `ReportResult`; si viene vacío, muestra `common.noData` |
| 3 | Observar el paginador | Muestra anterior/siguiente, hasta 5 números de página y la etiqueta `common.pagination.showing` (from/to/total) |

### TC-RPT-06 · Cambio de página y tamaño re-ejecuta

- **Prioridad:** Media · **Tipo:** Funcional · **Traza:** RF-RPT-3 (AC3.6) · **Independiente:** No del todo · **Dependencias:** reutiliza el flujo de TC-RPT-05 (ejecución previa dentro del mismo caso)
- **Setup:** login con `{{ADMIN_USER}}`; ejecutar primero el informe (pasos de TC-RPT-05) para tener resultados paginables. El caso incluye esa ejecución en el paso 1, por lo que sigue siendo autoejecutable.
- **Teardown:** logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Navegar a `{{BASE_URL_UI}}/reports/1`, rellenar filtros y pulsar `report-execute-btn` | Se muestran resultados (precondición interna) |
| 2 | Cambiar `report-page-size` a 50 | Nueva llamada `/execute?size=50&page=0` con los mismos filtros |
| 3 | Navegar a la página 3 del paginador | Nueva llamada `/execute?page=2&size=50` |

### TC-RPT-07 · Exportación CSV / TXT

- **Prioridad:** Alta · **Tipo:** Funcional, E2E · **Traza:** RF-RPT-4 (AC4.1–AC4.6), RNF-RPT-7 · **Independiente:** Sí (incluye la ejecución previa) · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`.
- **Teardown:** logout; eliminar los ficheros descargados del directorio de descargas.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Navegar a `{{BASE_URL_UI}}/reports/1`, rellenar filtros y pulsar `report-execute-btn` | La barra de exportación (`report-export-pdf/xlsx/csv/txt`) aparece |
| 2 | Pulsar `report-export-csv` | Se invoca `POST /api/v1/reports/1/export/CSV`; el navegador descarga `Informe de actividad mensual_{{TODAY}}.csv` |
| 3 | Pulsar `report-export-txt` | Se descarga el fichero `.txt` con cabecera y separador `---` |

### TC-RPT-08 · Exportación PDF / XLSX no implementada

- **Prioridad:** Baja · **Tipo:** Negativo · **Traza:** RF-RPT-4 (AC4.5) · **Independiente:** Sí (incluye la ejecución previa) · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`.
- **Teardown:** logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Navegar a `{{BASE_URL_UI}}/reports/1`, ejecutar el informe y pulsar `report-export-pdf` (o `report-export-xlsx`) | El backend lanza `ReportExportException` ("Export format PDF/XLSX not yet implemented"); el frontend muestra `notification.export.error` y no descarga fichero |

### TC-RPT-09 · Acceso sin autoridad REPORT_EXECUTE

- **Prioridad:** Alta · **Tipo:** Seguridad, API · **Traza:** RNF-RPT-1 · **Independiente:** Sí · **Dependencias:** requiere disponer de un token de un usuario **sin** `REPORT_EXECUTE`
- **Setup:** vía API. Obtener un access token de un usuario sin la autoridad `REPORT_EXECUTE` (crear uno con un perfil sin esa acción, o usar uno existente del entorno).
- **Teardown:** si se creó un usuario para la prueba, eliminarlo.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | `GET {{BASE_URL_API}}/api/v1/reports` con el token sin `REPORT_EXECUTE` | 403 Forbidden |
| 2 | `POST {{BASE_URL_API}}/api/v1/reports/1/execute` con el mismo token | 403 Forbidden |

### TC-RPT-10 · Componente de selección múltiple de informes (CVA)

- **Prioridad:** Media · **Tipo:** Funcional · **Traza:** RF-RPT-5 (AC5.1–AC5.7) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`; navegar al formulario de alta de usuario donde se integra `<tp-selected-reports>` (`{{BASE_URL_UI}}/administration/security/users` → *Crear*).
- **Teardown:** cancelar el formulario sin guardar; logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Abrir el modal de selección de informes con *Añadir* | Se abre el modal con búsqueda servidor (`GET /api/v1/reports/search?name=&page=&size=`) y paginación |
| 2 | Escribir un nombre en el buscador del modal y usar "Seleccionar página" | Se marcan/desmarcan los IDs de los informes de la página actual |
| 3 | Confirmar el modal (*Aceptar*) | El valor del CVA (`number[]`) se sobrescribe con los IDs seleccionados; se emiten `onChange()` y `onTouched()`; el modal se cierra |


---

## TCY-USR · Gestión de usuarios

Fuente: `02-functional/administration/security/users.md` (`RF-USR-*`, `RNF-USR-*`). Precondición del ciclo: usuario administrador `{{ADMIN_USER}}` con `USER_READ` y `USER_WRITE`; al menos un perfil de referencia disponible. Datos de alta tomados de `buildNewUser()`: usuario `e2e_user_{{UNIQUE}}`, contraseña `Test1234!`, email `e2e_user_{{UNIQUE}}@example.com`, nombre `E2E`, apellidos `Test`. Cada caso que crea un usuario lo elimina en el teardown, por lo que todos son independientes.

### TC-USR-01 · Listado paginado y ordenable

- **Prioridad:** Alta · **Tipo:** Funcional, E2E · **Traza:** RF-USR-1 (AC1.1–AC1.3) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`.
- **Teardown:** logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Navegar a `{{BASE_URL_UI}}/administration/security/users` | `users-table` visible con columnas usuario, nombre, apellidos, email, perfil y último acceso |
| 2 | Pulsar la cabecera de una columna | El listado se reordena ascendente; al volver a pulsar, descendente |
| 3 | Cambiar de página y de tamaño de página | La navegación paginada funciona y recarga los datos |

### TC-USR-02 · Búsqueda y filtrado

- **Prioridad:** Media · **Tipo:** Funcional · **Traza:** RF-USR-2 (AC2.1–AC2.4) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}` (el propio `admin` sirve como fila existente a buscar).
- **Teardown:** logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | En `{{BASE_URL_UI}}/administration/security/users`, escribir `admin` en `filter-username` y buscar | El listado muestra la fila del usuario `admin` y vuelve a la página 1 |
| 2 | Escribir `zzz_inexistente` en `filter-username` y buscar | El listado queda vacío |
| 3 | Pulsar limpiar filtros | Se restablecen los filtros y se recarga el listado completo |

### TC-USR-03 · Alta de usuario válida

- **Prioridad:** Alta · **Tipo:** Funcional, E2E · **Traza:** RF-USR-3 (AC3.1–AC3.4) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`; existe al menos un perfil seleccionable.
- **Teardown:** eliminar el usuario `e2e_user_{{UNIQUE}}` (vía UI o `DELETE /api/v1/administration/security/users/{id}`).

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | En el listado, pulsar `btn-create` | Se abre el formulario en modo alta |
| 2 | Rellenar usuario `e2e_user_{{UNIQUE}}`, contraseña `Test1234!`, email `e2e_user_{{UNIQUE}}@example.com`, nombre `E2E`, apellidos `Test` y seleccionar un perfil | Formulario válido |
| 3 | Guardar | El backend responde 201; se vuelve al listado |
| 4 | Buscar `e2e_user_{{UNIQUE}}` en `filter-username` | El nuevo usuario aparece en el listado |

### TC-USR-04 · Alta con email con formato inválido

- **Prioridad:** Media · **Tipo:** Negativo · **Traza:** RF-USR-3 (AC3.3) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`.
- **Teardown:** cancelar el formulario (no se crea nada); logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Abrir `btn-create` y rellenar usuario `e2e_user_{{UNIQUE}}`, contraseña `Test1234!`, perfil, y email `correo-sin-arroba` | — |
| 2 | Intentar guardar | El campo email marca error de formato y el guardado no se completa |

### TC-USR-05 · Edición de usuario (usuario inmutable)

- **Prioridad:** Alta · **Tipo:** Funcional, E2E · **Traza:** RF-USR-4 (AC4.1–AC4.3) · **Independiente:** Sí (crea su propio usuario) · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`; crear previamente el usuario `e2e_user_{{UNIQUE}}` (vía `POST /api/v1/administration/security/users` o repitiendo TC-USR-03) para editar un registro aislado.
- **Teardown:** eliminar `e2e_user_{{UNIQUE}}`.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Buscar y seleccionar `e2e_user_{{UNIQUE}}` y pulsar `btn-edit` | Se abre el formulario en modo edición; el campo usuario es de solo lectura; la contraseña no es obligatoria |
| 2 | Cambiar apellidos a `Test-Editado` y guardar | El backend responde 200 |
| 3 | Volver al listado y buscar el usuario | El cambio (`Test-Editado`) se refleja en la fila |

### TC-USR-06 · Eliminación con confirmación

- **Prioridad:** Alta · **Tipo:** Funcional, E2E · **Traza:** RF-USR-5 (AC5.1–AC5.3) · **Independiente:** Sí (crea su propio usuario) · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`; crear previamente `e2e_user_{{UNIQUE}}`.
- **Teardown:** si tras el caso el usuario sigue existiendo (fallo), eliminarlo por API.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Seleccionar `e2e_user_{{UNIQUE}}` y pulsar `btn-delete` | Se abre el modal de confirmación con el nombre del usuario |
| 2 | Pulsar cancelar | El modal se cierra y el usuario sigue en el listado |
| 3 | Repetir y confirmar | El backend responde 204 y el usuario desaparece al buscarlo |

### TC-USR-07 · Detalle con doble clic y auditoría

- **Prioridad:** Media · **Tipo:** Funcional · **Traza:** RF-USR-6 (AC6.1–AC6.3) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`.
- **Teardown:** logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | En el listado, doble clic sobre la fila del usuario `admin` | Se abre el detalle en modo solo lectura |
| 2 | Observar el contenido | Muestra auditoría (último acceso, creación, última modificación) y la contraseña enmascarada |

### TC-USR-08 · Autoservicio del perfil propio (/me)

- **Prioridad:** Media · **Tipo:** Funcional, API · **Traza:** RF-USR-6 (AC6.4) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** vía API. Login con `{{ADMIN_USER}}` y obtener token.
- **Teardown:** restaurar los valores originales del usuario (`PUT /me` con los datos previos) para no dejar el perfil alterado.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | `GET {{BASE_URL_API}}/api/v1/administration/security/users/me` | 200 OK con el perfil del usuario autenticado |
| 2 | `PUT {{BASE_URL_API}}/api/v1/administration/security/users/me` con `{ "firstName": "Admin", "lastName": "Autoservicio", "email": "admin@example.com" }` | 200 OK con los datos actualizados |

### TC-USR-09 · Exportación CSV filtrada

- **Prioridad:** Media · **Tipo:** Funcional, E2E · **Traza:** RF-USR-7 (AC7.1–AC7.3) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`.
- **Teardown:** eliminar el fichero descargado; logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | En el listado, sin filtros, pulsar `btn-export` | El navegador descarga `users_{{TODAY}}.csv` con todos los registros que cumplen los filtros (no solo la página visible) |
| 2 | Filtrar por `zzz_inexistente` y pulsar `btn-export` | Se notifica que no hay datos que exportar y no se genera fichero |

### TC-USR-10 · Autorización y visibilidad de acciones

- **Prioridad:** Alta · **Tipo:** Seguridad, API · **Traza:** RNF-USR-1, RNF-USR-2 · **Independiente:** Sí · **Dependencias:** requiere un usuario con `USER_READ` pero sin `USER_WRITE`
- **Setup:** vía API/UI. Preparar un usuario de solo lectura (perfil con `USER_READ` sin `USER_WRITE`) y obtener su token.
- **Teardown:** eliminar el usuario/perfil de prueba creados.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Con token sin `USER_READ` ni `USER_WRITE`, `GET /api/v1/administration/security/users` | 403 Forbidden |
| 2 | Con token `USER_READ` (sin `USER_WRITE`), abrir el listado en la UI | Los botones `btn-create`, `btn-edit` y `btn-delete` no se muestran |
| 3 | Con ese mismo token, `POST /api/v1/administration/security/users` | 403 Forbidden |

---

## TCY-PRO · Gestión de perfiles

Fuente: `02-functional/administration/security/profiles.md` (`RF-PRO-*`, `RNF-PRO-*`). Precondición del ciclo: usuario con `PROFILE_READ` y `PROFILE_WRITE`. Datos de alta tomados de `buildNewProfile()`: nombre `e2e_profile_{{UNIQUE}}`, descripción `Perfil de prueba {{UNIQUE}}`. Cada caso que crea un perfil lo elimina en el teardown.

### TC-PRO-01 · Listado paginado y ordenable

- **Prioridad:** Alta · **Tipo:** Funcional · **Traza:** RF-PRO-1 (AC1.1–AC1.3) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`.
- **Teardown:** logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Navegar a `{{BASE_URL_UI}}/administration/security/profiles` | `profiles-table` visible con nombre, descripción, nº de acciones y fecha de creación |
| 2 | Ordenar por una columna y paginar | La ordenación y la paginación funcionan |

### TC-PRO-02 · Búsqueda por nombre

- **Prioridad:** Media · **Tipo:** Funcional · **Traza:** RF-PRO-2 (AC2.1–AC2.3) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`; existe el perfil semilla `ADMIN`.
- **Teardown:** logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Escribir `ADMIN` en `filter-name` y buscar | Muestra la fila del perfil `ADMIN` y vuelve a la página 1 |
| 2 | Escribir `zzz_inexistente` y buscar | Listado vacío |
| 3 | Limpiar | Recarga el listado completo |

### TC-PRO-03 · Alta de perfil con acciones

- **Prioridad:** Alta · **Tipo:** Funcional, E2E · **Traza:** RF-PRO-3 (AC3.1–AC3.4), RNF-PRO-3 · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`; catálogo de acciones disponible.
- **Teardown:** eliminar el perfil `e2e_profile_{{UNIQUE}}`.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Pulsar `btn-create`, informar nombre `e2e_profile_{{UNIQUE}}`, descripción y seleccionar 2 acciones distintas | Formulario válido |
| 2 | Guardar | El backend responde 201; el perfil aparece al buscarlo |
| 3 | Comprobar la integridad | El perfil no admite acciones duplicadas (el backend rechaza duplicados) |

### TC-PRO-04 · Edición de perfil (reemplazo de acciones)

- **Prioridad:** Alta · **Tipo:** Funcional, E2E · **Traza:** RF-PRO-4 (AC4.1–AC4.3) · **Independiente:** Sí (crea su propio perfil) · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`; crear previamente `e2e_profile_{{UNIQUE}}`.
- **Teardown:** eliminar `e2e_profile_{{UNIQUE}}`.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Seleccionar `e2e_profile_{{UNIQUE}}` y pulsar `btn-edit` | Formulario en modo edición |
| 2 | Cambiar la descripción y reemplazar la lista de acciones por otra distinta, guardar | 200 OK; la lista de acciones se reemplaza completa (no se fusiona) y el cambio se refleja en el listado |

### TC-PRO-05 · Eliminación con confirmación

- **Prioridad:** Alta · **Tipo:** Funcional, E2E · **Traza:** RF-PRO-5 (AC5.1–AC5.3) · **Independiente:** Sí (crea su propio perfil) · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`; crear `e2e_profile_{{UNIQUE}}` sin usuarios asociados.
- **Teardown:** si queda tras un fallo, eliminarlo por API.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Seleccionar `e2e_profile_{{UNIQUE}}` y pulsar `btn-delete` → cancelar | No se elimina |
| 2 | Repetir y confirmar | 204; el perfil desaparece al buscarlo |

### TC-PRO-06 · Eliminación de perfil en uso

- **Prioridad:** Alta · **Tipo:** Negativo · **Traza:** RF-PRO-5 (AC5.4) · **Independiente:** Sí · **Dependencias:** ninguna (usa un perfil semilla asignado a usuarios, p. ej. `ADMIN`)
- **Setup:** login con `{{ADMIN_USER}}`; identificar un perfil asignado a al menos un usuario (`ADMIN`).
- **Teardown:** logout (no se elimina nada).

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Seleccionar el perfil `ADMIN` (en uso) y confirmar su eliminación | El backend devuelve `EntityInUseException`; la operación se rechaza y el perfil permanece |

### TC-PRO-07 · Detalle de perfil

- **Prioridad:** Media · **Tipo:** Funcional · **Traza:** RF-PRO-6 (AC6.1–AC6.3) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`.
- **Teardown:** logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Doble clic sobre el perfil `ADMIN` | Detalle en solo lectura con datos generales, acciones asignadas y fechas de creación/modificación |

### TC-PRO-08 · Exportación CSV

- **Prioridad:** Media · **Tipo:** Funcional, E2E · **Traza:** RF-PRO-7 (AC7.1–AC7.3) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`.
- **Teardown:** eliminar el fichero descargado; logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Sin filtros, pulsar `btn-export` | Descarga `profiles_{{TODAY}}.csv` con todos los registros filtrados |
| 2 | Filtrar por `zzz_inexistente` y exportar | Notifica que no hay datos; sin descarga |

### TC-PRO-09 · Autorización y endpoint de referencias

- **Prioridad:** Alta · **Tipo:** Seguridad, API · **Traza:** RNF-PRO-1, RNF-PRO-2 · **Independiente:** Sí · **Dependencias:** requiere tokens con distintos permisos
- **Setup:** vía API. Preparar: (a) token sin `PROFILE_READ`; (b) token con `PROFILE_READ` sin `PROFILE_WRITE`; (c) token con `USER_READ`.
- **Teardown:** eliminar usuarios/perfiles de prueba.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Con token sin `PROFILE_READ`, `GET /api/v1/administration/security/profiles` | 403 Forbidden |
| 2 | Con token `PROFILE_READ` sin `PROFILE_WRITE`, abrir el listado en UI y luego `POST /profiles` | Botones crear/editar/eliminar ocultos; el POST responde 403 |
| 3 | Con token `USER_READ`, `GET /api/v1/administration/security/profiles/references` | 200 OK (el endpoint de referencias se permite al consumidor del listado de usuarios) |

---

## TCY-ACC · Catálogo de acciones

Fuente: `02-functional/administration/security/actions.md` (`RF-ACC-*`, `RNF-ACC-*`). Precondición del ciclo: usuario con `ACTION_READ`; catálogo semilla cargado (p. ej. `USER_READ`, `USER_WRITE`). No hay alta ni borrado: el catálogo es semilla.

### TC-ACC-01 · Listado paginado y ordenable

- **Prioridad:** Alta · **Tipo:** Funcional · **Traza:** RF-ACC-1 (AC1.1–AC1.3) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`.
- **Teardown:** logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Navegar a `{{BASE_URL_UI}}/administration/security/actions` | `actions-table` visible con código, nombre, tipo y descripción |
| 2 | Ordenar por una columna y paginar | Ordenación y paginación funcionan |

### TC-ACC-02 · Filtrado por código y tipo

- **Prioridad:** Media · **Tipo:** Funcional · **Traza:** RF-ACC-2 (AC2.1–AC2.4) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`.
- **Teardown:** logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Escribir `USER` en `filter-code` y seleccionar tipo `READ` en `filter-type`, buscar | El listado se reduce a las acciones cuyo código contiene `USER` y son de tipo `READ`; vuelve a página 1 |
| 2 | Limpiar | Recarga el listado completo |

### TC-ACC-03 · Detalle de acción

- **Prioridad:** Media · **Tipo:** Funcional · **Traza:** RF-ACC-3 (AC3.1–AC3.3) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`.
- **Teardown:** logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Doble clic sobre la acción `USER_READ` | Detalle con código, nombre, tipo, descripción y fechas; botón de edición disponible |

### TC-ACC-04 · Edición de metadatos (código inmutable)

- **Prioridad:** Alta · **Tipo:** Funcional, E2E · **Traza:** RF-ACC-4 (AC4.1–AC4.5) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`. Nota: edita un registro semilla; anotar el valor original para restaurarlo.
- **Teardown:** restaurar el nombre/descripcion/tipo originales de la acción editada.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Seleccionar `USER_READ`, pulsar `btn-edit` | El campo código es de solo lectura |
| 2 | Cambiar el nombre a `Leer usuarios (test {{UNIQUE}})`, mantener tipo `READ`, guardar | 200 OK; el cambio se refleja en el listado |
| 3 | (Teardown) Restaurar el nombre original | El registro vuelve a su valor semilla |

### TC-ACC-05 · Exportación CSV

- **Prioridad:** Media · **Tipo:** Funcional · **Traza:** RF-ACC-5 (AC5.1–AC5.3) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`.
- **Teardown:** eliminar el fichero descargado; logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Sin filtros, pulsar `btn-export` | Descarga `actions_{{TODAY}}.csv` con todos los registros filtrados |
| 2 | Filtrar por `zzz_inexistente` y exportar | Notifica que no hay datos; sin descarga |

### TC-ACC-06 · Alta y borrado prohibidos (catálogo semilla)

- **Prioridad:** Alta · **Tipo:** Negativo, Seguridad, API · **Traza:** RF-ACC-6 (AC6.1–AC6.3) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** vía API con token de `{{ADMIN_USER}}`.
- **Teardown:** No aplica.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | `POST {{BASE_URL_API}}/api/v1/administration/security/actions` con un cuerpo cualquiera | 405 Method Not Allowed (`MethodNotAllowedException`) |
| 2 | `DELETE {{BASE_URL_API}}/api/v1/administration/security/actions/1` | 405 Method Not Allowed |
| 3 | Abrir la pantalla en la UI | No existen botones de crear ni eliminar |

### TC-ACC-07 · Integridad del catálogo de tipos

- **Prioridad:** Media · **Tipo:** Negativo, API · **Traza:** RNF-ACC-3 · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** vía API con token de `{{ADMIN_USER}}`; identificar el `id` de la acción `USER_READ`.
- **Teardown:** si el valor cambiara, restaurarlo.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | `PUT {{BASE_URL_API}}/api/v1/administration/security/actions/{id}` con `type` fuera de `READ`/`WRITE`/`EXECUTE` (p. ej. `"DELETE"`) | La operación se rechaza por validación (el tipo debe pertenecer al enum) |

---

## TCY-PAR · Parámetros

Fuente: `02-functional/administration/parameters/parameters.md` (`RF-PAR-*`, `RNF-PAR-*`). Precondición del ciclo: usuario con `SYSTEM_PARAMETER_READ` / `SYSTEM_PARAMETER_WRITE`. Datos de alta tomados de `buildNewParameter()`: código `E2E_PARAM_{{UNIQUE}}`, descripción `Parámetro de prueba {{UNIQUE}}`, valor `value-{{UNIQUE}}`, tipo `STRING`. Cada caso que crea un parámetro lo elimina en el teardown.

### TC-PAR-01 · Listado paginado y ordenable

- **Prioridad:** Alta · **Tipo:** Funcional · **Traza:** RF-PAR-1 (AC1.1–AC1.3) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`.
- **Teardown:** logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Navegar a `{{BASE_URL_UI}}/administration/parameters` | `parameters-table` visible con código, descripción, tipo y valor |
| 2 | Ordenar por una columna y paginar | Ordenación y paginación funcionan |

### TC-PAR-02 · Filtrado por código, descripción y tipo

- **Prioridad:** Media · **Tipo:** Funcional · **Traza:** RF-PAR-2 (AC2.1–AC2.5) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`.
- **Teardown:** logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Filtrar por un fragmento de código y por un tipo (p. ej. `STRING`), buscar | El listado se reduce y vuelve a página 1 |
| 2 | Limpiar | Recarga el listado completo |

### TC-PAR-03 · Alta de parámetro válida

- **Prioridad:** Alta · **Tipo:** Funcional, E2E · **Traza:** RF-PAR-3 (AC3.1–AC3.5) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`.
- **Teardown:** eliminar `E2E_PARAM_{{UNIQUE}}`.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Pulsar `btn-create`, informar código `E2E_PARAM_{{UNIQUE}}`, tipo `STRING`, valor `value-{{UNIQUE}}`, descripción | Formulario válido; `Guardar` habilitado |
| 2 | Vaciar el campo valor (obligatorio) | El campo se marca inválido y `Guardar` queda deshabilitado |
| 3 | Restaurar el valor y guardar | El backend responde 201; el parámetro aparece al buscarlo |

### TC-PAR-04 · Alta con código duplicado

- **Prioridad:** Alta · **Tipo:** Negativo · **Traza:** RF-PAR-3 (AC3.3), RNF-PAR-3 · **Independiente:** Sí (crea y luego duplica) · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`; crear `E2E_PARAM_{{UNIQUE}}` como primer parámetro.
- **Teardown:** eliminar `E2E_PARAM_{{UNIQUE}}`.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Intentar crear otro parámetro con el mismo código `E2E_PARAM_{{UNIQUE}}` | El backend devuelve `409 Conflict` y la operación queda bloqueada |

### TC-PAR-05 · Edición (código inmutable)

- **Prioridad:** Alta · **Tipo:** Funcional, E2E · **Traza:** RF-PAR-4 (AC4.1–AC4.4) · **Independiente:** Sí (crea su propio parámetro) · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`; crear `E2E_PARAM_{{UNIQUE}}`.
- **Teardown:** eliminar `E2E_PARAM_{{UNIQUE}}`.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Seleccionar `E2E_PARAM_{{UNIQUE}}` y pulsar `btn-edit` | El código es de solo lectura |
| 2 | Cambiar el valor a `value-editado-{{UNIQUE}}` (compatible con tipo `STRING`) y guardar | 200 OK; el cambio se refleja en el listado |

### TC-PAR-06 · Eliminación con confirmación

- **Prioridad:** Media · **Tipo:** Funcional, E2E · **Traza:** RF-PAR-5 (AC5.1–AC5.3) · **Independiente:** Sí (crea su propio parámetro) · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`; crear `E2E_PARAM_{{UNIQUE}}`.
- **Teardown:** si queda tras un fallo, eliminarlo por API.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Seleccionar `E2E_PARAM_{{UNIQUE}}` y pulsar `btn-delete` → cancelar | No se elimina |
| 2 | Repetir y confirmar | 204; desaparece del listado |

### TC-PAR-07 · Detalle de parámetro

- **Prioridad:** Baja · **Tipo:** Funcional · **Traza:** RF-PAR-6 (AC6.1–AC6.3) · **Independiente:** Sí (crea su propio parámetro) · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`; crear `E2E_PARAM_{{UNIQUE}}`.
- **Teardown:** eliminar `E2E_PARAM_{{UNIQUE}}`.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Doble clic sobre `E2E_PARAM_{{UNIQUE}}` | Detalle con datos y auditoría; valor y tipo deshabilitados |

### TC-PAR-08 · Validación de compatibilidad tipo/valor

- **Prioridad:** Alta · **Tipo:** Negativo · **Traza:** RF-PAR-7 (AC7.1–AC7.4), RNF-PAR-4 · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`; usar el formulario de alta (cancelar al final de cada subcaso).
- **Teardown:** eliminar los parámetros que se lleguen a crear.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Tipo `INTEGER`, valor `abc` | Rechazado (exige entero válido) |
| 2 | Tipo `BOOLEAN`, valor `yes` | Rechazado (solo `true`/`false`) |
| 3 | Tipo `DATE`, valor `31-12-2026` | Rechazado (exige ISO 8601) |
| 4 | Tipo `STRING`, valor `cualquier texto` | Aceptado |

### TC-PAR-09 · Autorización y visibilidad

- **Prioridad:** Alta · **Tipo:** Seguridad, API · **Traza:** RNF-PAR-1, RNF-PAR-2 · **Independiente:** Sí · **Dependencias:** requiere token con `SYSTEM_PARAMETER_READ` sin `SYSTEM_PARAMETER_WRITE`
- **Setup:** preparar un usuario de solo lectura de parámetros y su token.
- **Teardown:** eliminar el usuario/perfil de prueba.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Con token `SYSTEM_PARAMETER_READ` (sin write), abrir el listado en UI | Los botones `btn-create`, `btn-edit`, `btn-delete` no se muestran |
| 2 | Con ese token, `POST /api/v1/administration/parameters` | 403 Forbidden |

---

## TCY-AUD · Auditoría

Fuente: `02-functional/administration/audit/audit.md` (`RF-AUD-*`, `RNF-AUD-*`). Precondición del ciclo: usuario con `SYSTEM_LOG_READ`; tabla `audit_log` con datos (el propio login genera un registro `EXECUTE` en sección `SECURITY`). Pantalla de solo lectura.

> ⚠️ **Caso bloqueado en este ciclo:** TC-AUD-03 (filtrado por rango de fechas) está 🔴 **BLOQUEADO** por una discrepancia de contrato pendiente de revisión funcional y técnica. Excluirlo de la ejecución hasta desbloquearlo.

### TC-AUD-01 · Listado de solo lectura paginado

- **Prioridad:** Alta · **Tipo:** Funcional · **Traza:** RF-AUD-1 (AC1.1–AC1.3), RF-AUD-5 (AC5.2) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}` (genera un registro de auditoría conocido).
- **Teardown:** logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Navegar a `{{BASE_URL_UI}}/administration/audit` | `audit-table` y los filtros son visibles; no existen acciones de crear, editar ni eliminar |
| 2 | Ordenar por una columna y cambiar el tamaño de página (5/10/20/50) | Ordenación y paginación funcionan |

### TC-AUD-02 · Filtrado por usuario, operación y sección

- **Prioridad:** Media · **Tipo:** Funcional · **Traza:** RF-AUD-2 (AC2.1–AC2.5) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`.
- **Teardown:** logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Rellenar `audit-filter-username` = `{{ADMIN_USER}}`, `audit-filter-operation-type` = `EXECUTE`, `audit-filter-section` = `SECURITY` y pulsar `audit-apply-filters` | El listado muestra los registros coincidentes y vuelve a página 1 |
| 2 | Pulsar `audit-clear-filters` | Se recarga la consulta sin criterios |

### TC-AUD-03 · Filtrado por rango de fechas

- **Estado:** 🔴 **BLOQUEADO** — pendiente de revisión funcional y técnica. No ejecutar hasta desbloquear.
- **Prioridad:** Media · **Tipo:** Funcional · **Traza:** RF-AUD-2 (AC2.4) · **Independiente:** Sí · **Dependencias:** ninguna
- **Motivo del bloqueo:** la sección 3.4 del documento funcional (`audit.md`) declara una **discrepancia abierta** en el contrato de filtros de fecha: el frontend envía `dateFrom`/`dateTo` (controles HTML `date`) y el backend espera `fromDate`/`toDate` (`OffsetDateTime`). El filtrado por fecha no está alineado de extremo a extremo. Esta parte está pendiente de revisión funcional y técnica.
- **Condición para desbloquear:** alinear el contrato de fechas entre `AuditService` (frontend) y `AuditController` (backend), verificar el comportamiento de extremo a extremo y actualizar la sección 3.4 de `audit.md`. Una vez hecho, retirar el estado BLOQUEADO y validar los pasos.
- **Setup:** login con `{{ADMIN_USER}}`.
- **Teardown:** logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Informar `audit-filter-date-from` = fecha de hace 7 días y `audit-filter-date-to` = `{{TODAY}}`, aplicar | Los registros se restringen al rango (una vez alineado el contrato de fechas) |

### TC-AUD-04 · Consulta de detalle

- **Prioridad:** Media · **Tipo:** Funcional · **Traza:** RF-AUD-3 (AC3.1–AC3.4) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`; al menos un registro en el listado.
- **Teardown:** logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Seleccionar la primera fila del listado | Se abre el detalle con todos los datos del registro, sin acciones CRUD |
| 2 | Pulsar *Volver* | Se restaura el listado y se elimina la selección |

### TC-AUD-05 · Exportación CSV filtrada

- **Prioridad:** Media · **Tipo:** Funcional · **Traza:** RF-AUD-4 (AC4.1–AC4.4) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`.
- **Teardown:** eliminar el fichero descargado; logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Filtrar por `audit-filter-username` = `{{ADMIN_USER}}` y pulsar `audit-export-csv` | Descarga `audit_{{TODAY}}.csv` con todos los registros filtrados (no solo la página) |
| 2 | Filtrar por un usuario inexistente y exportar | Se notifica que no hay datos; sin descarga |

### TC-AUD-06 · Inmutabilidad del registro (API)

- **Prioridad:** Alta · **Tipo:** Seguridad, Negativo, API · **Traza:** RF-AUD-5 (AC5.1), RNF-AUD-3 · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** vía API con token de `{{ADMIN_USER}}`.
- **Teardown:** No aplica.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | `GET {{BASE_URL_API}}/api/v1/administration/audit` y `GET .../audit/count` | 200 OK (son los únicos verbos expuestos) |
| 2 | Intentar `POST`, `PUT`, `PATCH` o `DELETE` sobre `/api/v1/administration/audit` | No existe endpoint de escritura; la operación se rechaza (no permitida) |

### TC-AUD-07 · Registro automático de operación auditable

- **Prioridad:** Alta · **Tipo:** Funcional · **Traza:** RF-AUD-5 (AC5.3), RNF-AUD-4 · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** vía API/UI. Partir sin sesión.
- **Teardown:** logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Iniciar sesión con `{{ADMIN_USER}}` (operación auditable) | Tras completarse, se genera una entrada `EXECUTE` en sección `SECURITY` |
| 2 | Consultar la auditoría filtrando por `{{ADMIN_USER}}` y `EXECUTE` | Aparece el registro recién generado por el login |

---

## TCY-IFM · Monitor de interfaces

Fuente: `02-functional/interfaces/monitor/monitor.md` (`RF-IFM-*`, `RNF-IFM-*`). Precondición del ciclo: usuario con `INTERFACES_READ`; tabla `interface_log` con datos semilla (`20250120-seed-local-interface-log.xml`). Pantalla de solo lectura.

### TC-IFM-01 · Listado paginado de solo lectura

- **Prioridad:** Alta · **Tipo:** Funcional · **Traza:** RF-IFM-1 (AC1.1–AC1.5) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`.
- **Teardown:** logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Navegar a `{{BASE_URL_UI}}/interfaces/monitor` | `monitor-table` visible con fecha/hora, tipo de operación, interfaz y estado; sin acciones de crear/editar/eliminar |
| 2 | Ordenar por una columna y cambiar tamaño de página (5/10/20/50) | Ordenación/paginación en servidor; si no hay datos muestra `common.noData` |

### TC-IFM-02 · Filtrado por tipo y estado

- **Prioridad:** Media · **Tipo:** Funcional · **Traza:** RF-IFM-2 (AC2.2, AC2.4–AC2.6) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`.
- **Teardown:** logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Seleccionar `monitor-filter-operation-type` = `POST`, `monitor-filter-status` = `ERROR` y pulsar `monitor-apply-filters` | El listado muestra solo operaciones POST con estado ERROR y reinicia a página 0 |
| 2 | Pulsar `monitor-clear-filters` | Se restablecen filtros y se recarga el listado completo desde la página 0 |

### TC-IFM-03 · Filtrado por interfaz

- **Prioridad:** Media · **Tipo:** Funcional · **Traza:** RF-IFM-2 (AC2.3) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`; el desplegable de interfaz se puebla desde `GET /api/v1/interfaces/configuration`.
- **Teardown:** logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Seleccionar una interfaz concreta en `monitor-filter-interface` y aplicar | Solo se muestran operaciones de esa interfaz |

### TC-IFM-04 · Detalle desde la barra de acciones

- **Prioridad:** Media · **Tipo:** Funcional · **Traza:** RF-IFM-3 (AC3.1–AC3.4) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`; al menos una fila en el listado.
- **Teardown:** logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Seleccionar una fila y pulsar `monitor-view-detail` | La vista de detalle muestra timestamp, tipo, interfaz, estado, `requestPayload`, `responsePayload` y `errorMessage` en bloques `<pre>` |
| 2 | Pulsar `monitor-back-to-list` | Restaura el listado manteniendo la página y la selección previas |

### TC-IFM-05 · Detalle por doble clic

- **Prioridad:** Baja · **Tipo:** UI · **Traza:** RF-IFM-3 (AC3.1) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`.
- **Teardown:** logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Doble clic sobre la primera fila de `monitor-table` | Abre la vista de detalle |
| 2 | Pulsar `monitor-back-to-list` | Restaura el listado |

### TC-IFM-06 · Exportación CSV completa

- **Prioridad:** Alta · **Tipo:** Funcional · **Traza:** RF-IFM-4 (AC4.1, AC4.3–AC4.5) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`.
- **Teardown:** eliminar el fichero descargado; logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Aplicar algún filtro con resultados y pulsar `monitor-export-csv` | Descarga `interfaces_monitor_{{TODAY}}.csv` con BOM UTF-8, cabeceras traducidas y campos escapados; incluye todos los registros filtrados (no solo la página) |

### TC-IFM-07 · Exportación sin coincidencias

- **Prioridad:** Baja · **Tipo:** Negativo · **Traza:** RF-IFM-4 (AC4.2) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`.
- **Teardown:** logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Aplicar un filtro que no devuelva resultados (p. ej. rango de fechas vacío de datos) y pulsar `monitor-export-csv` | Notificación de aviso `notification.export.empty` sin descarga |

### TC-IFM-08 · Acceso sin autorización y bloqueo de escritura

- **Prioridad:** Alta · **Tipo:** Seguridad, Negativo, API · **Traza:** RNF-IFM-1 · **Independiente:** Sí · **Dependencias:** requiere token sin `INTERFACES_READ`
- **Setup:** preparar un usuario sin `INTERFACES_READ` y su token; también un token de `{{ADMIN_USER}}` para el bloqueo de escritura.
- **Teardown:** eliminar el usuario/perfil de prueba.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Con el usuario sin `INTERFACES_READ`, navegar a `{{BASE_URL_UI}}/interfaces/monitor` | El guard redirige a `/forbidden`; la API responde 403 |
| 2 | Con token de `{{ADMIN_USER}}`, `POST`/`PUT`/`DELETE` sobre `/api/v1/interfaces/**` | `MethodNotAllowedException` / operación denegada |

---

## TCY-CFG · Configuración de interfaces

Fuente: `02-functional/interfaces/configuration/configuration.md` (`RF-CFG-*`, `RNF-CFG-*`). Precondición del ciclo: usuario con `INTERFACES_READ`; al menos una interfaz registrada. Pantalla de solo lectura; paginación/orden/filtrado en cliente.

### TC-CFG-01 · Listado paginado con indicadores de estado

- **Prioridad:** Alta · **Tipo:** Funcional · **Traza:** RF-CFG-1 (AC1.1–AC1.4) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`.
- **Teardown:** logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Navegar a `{{BASE_URL_UI}}/interfaces/configuration` | `interfaces-table` visible con nombre, protocolo, URL, estado, frecuencia de check y última modificación |
| 2 | Observar la columna estado | Etiquetas de color: verde `ACTIVE`, rojo `ERROR`, gris `INACTIVE` |

### TC-CFG-02 · Filtrado por nombre, protocolo y estado

- **Prioridad:** Media · **Tipo:** Funcional · **Traza:** RF-CFG-2 (AC2.1–AC2.5) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`.
- **Teardown:** logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Rellenar `filter-name` (parcial), seleccionar `filter-protocol` y `filter-status`, buscar | El listado se reduce a las filas coincidentes y vuelve a página 1 |
| 2 | Limpiar | Recarga el listado completo |

### TC-CFG-03 · Detalle de interfaz

- **Prioridad:** Media · **Tipo:** Funcional · **Traza:** RF-CFG-3 (AC3.1–AC3.4) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`; al menos una fila.
- **Teardown:** logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Doble clic sobre una fila (o seleccionar y pulsar `btn-view-detail`) | Muestra nombre, descripción, URL, protocolo, estado, frecuencia de check y fechas |
| 2 | Pulsar *Volver* | Regresa al listado |

### TC-CFG-04 · Exportación CSV

- **Prioridad:** Media · **Tipo:** Funcional · **Traza:** RF-CFG-4 (AC4.1–AC4.3) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`.
- **Teardown:** eliminar el fichero descargado; logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Sin filtros, pulsar `btn-export` | Descarga `interface-configurations_{{TODAY}}.csv` con todos los registros filtrados |
| 2 | Filtrar por `filter-name` = `zzz_inexistente` y exportar | No se genera ninguna descarga |

### TC-CFG-05 · Pantalla de solo lectura

- **Prioridad:** Alta · **Tipo:** Negativo, Seguridad · **Traza:** RF-CFG-5 (AC5.1–AC5.3) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`.
- **Teardown:** logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Observar la pantalla de configuración | No hay acciones de crear, editar ni eliminar |
| 2 | Comprobar la API (`GET /api/v1/interfaces/configuration`) | Solo expone operaciones `GET` sobre interfaces |

### TC-CFG-06 · Acceso sin autorización

- **Prioridad:** Alta · **Tipo:** Seguridad · **Traza:** RNF-CFG-1 · **Independiente:** Sí · **Dependencias:** requiere token/usuario sin `INTERFACES_READ`
- **Setup:** preparar un usuario sin `INTERFACES_READ`.
- **Teardown:** eliminar el usuario/perfil de prueba.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Con ese usuario, navegar a `{{BASE_URL_UI}}/interfaces/configuration` | Acceso denegado por `actionGuard` (redirección a `/forbidden`) |

---

## TCY-CLN · Nodos del cluster

Fuente: `02-functional/administration/cluster/cluster-nodes.md` (`RF-CLN-*`, `RNF-CLN-*`). Precondición del ciclo: usuario con `CLUSTER_NODE_READ` (y `CLUSTER_NODE_WRITE` para designar maestro); al menos una instancia registrada (se registra sola al arrancar). Requiere PostgreSQL.

### TC-CLN-01 · Listado de nodos

- **Prioridad:** Alta · **Tipo:** Funcional · **Traza:** RF-CLN-1 (AC1.1–AC1.3) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`.
- **Teardown:** logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Navegar a `{{BASE_URL_UI}}/administration/cluster/nodes` | `cluster-nodes-table` visible con hostname, IP, estado, maestro, inicio, última actualización y métricas de memoria; sin acciones de crear/eliminar |
| 2 | Ordenar y cambiar tamaño de página (5/10/20/50) | Ordenación y paginación funcionan |

### TC-CLN-02 · Filtrado por hostname, estado y maestro

- **Prioridad:** Media · **Tipo:** Funcional · **Traza:** RF-CLN-2 (AC2.1–AC2.4) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`; identificar el hostname de un nodo existente.
- **Teardown:** logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Rellenar `filter-hostname` (parcial), seleccionar `filter-status` y `filter-master`, pulsar `btn-filter-search` | El listado se reduce a las filas coincidentes; vuelve a página 1 y elimina la selección |
| 2 | Pulsar `btn-filter-clear` | Recarga el listado completo |

### TC-CLN-03 · Detalle de nodo

- **Prioridad:** Media · **Tipo:** Funcional · **Traza:** RF-CLN-3 (AC3.1–AC3.3) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`.
- **Teardown:** logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Doble clic sobre una fila | Detalle en solo lectura con datos operativos y métricas de memoria |
| 2 | Pulsar *Volver* | Regresa al listado sin modificar el nodo |

### TC-CLN-04 · Designación de nodo maestro

- **Prioridad:** Alta · **Tipo:** Funcional · **Traza:** RF-CLN-4 (AC4.1–AC4.5), RNF-CLN-2 · **Independiente:** Condicional · **Dependencias:** requiere al menos **dos** nodos activos (uno no maestro) para validarse de forma aislada; modifica estado compartido
- **Setup:** login con `{{ADMIN_USER}}` (con `CLUSTER_NODE_WRITE`); entorno con ≥2 nodos activos. Anotar quién es el maestro actual.
- **Teardown:** restaurar el maestro original designándolo de nuevo (`PATCH /{idOriginal}` con `{ "master": true }`), para dejar el cluster como estaba.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Seleccionar un nodo activo que no sea maestro | `btn-set-master` se habilita |
| 2 | Pulsar `btn-set-master` y confirmar en el modal (identifica el hostname) | `PATCH /{id}` con `{ "master": true }`; el nodo pasa a maestro y el anterior pierde el indicador; el listado se recarga |

### TC-CLN-05 · Botón de maestro deshabilitado por reglas

- **Prioridad:** Media · **Tipo:** Negativo · **Traza:** RF-CLN-4 (AC4.2) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`.
- **Teardown:** logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Seleccionar el nodo maestro actual (o un nodo inactivo) | `btn-set-master` permanece deshabilitado |

### TC-CLN-06 · Exportación CSV

- **Prioridad:** Media · **Tipo:** Funcional · **Traza:** RF-CLN-5 (AC5.1–AC5.3) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`.
- **Teardown:** eliminar el fichero descargado; logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Sin filtros, pulsar `btn-export` | Descarga `cluster-nodes_{{TODAY}}.csv` con todos los registros filtrados y métricas de memoria en GB y porcentaje |

### TC-CLN-07 · Registro y eliminación controlados por el sistema

- **Prioridad:** Alta · **Tipo:** Negativo, Seguridad, API · **Traza:** RF-CLN-6 (AC6.1–AC6.3) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** vía API con token de `{{ADMIN_USER}}`.
- **Teardown:** No aplica.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | `POST {{BASE_URL_API}}/api/v1/administration/cluster/nodes` | 405 Method Not Allowed |
| 2 | `DELETE {{BASE_URL_API}}/api/v1/administration/cluster/nodes/1` | 405 Method Not Allowed |
| 3 | Observar la pantalla | No hay acciones de crear ni eliminar; los nodos se registran automáticamente al arrancar la instancia |

---

## TCY-CLB · Bloqueos del cluster

Fuente: `02-functional/administration/cluster/cluster-blocks.md` (`RF-CLB-*`, `RNF-CLB-*`). Precondición del ciclo: usuario con `CLUSTER_LOCK_READ`; backend con al menos un lock adquirido/liberado (habitualmente el bloqueo `NODOS` del `HeartbeatWorker`). Requiere PostgreSQL (los advisory locks no operan sobre H2). Pantalla de solo lectura.

### TC-CLB-01 · Listado de bloqueos con métricas

- **Prioridad:** Alta · **Tipo:** Funcional · **Traza:** RF-CLB-1 (AC1.1–AC1.4) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`; el backend ha generado al menos un bloqueo.
- **Teardown:** logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Navegar a `{{BASE_URL_UI}}/administration/cluster/blocks` | `cluster-blocks-table` visible con nombre de tarea, fecha de inicio, tiempo promedio/mínimo/máximo y total de ejecuciones; sin acciones CRUD |
| 2 | Ordenar y cambiar tamaño de página (5/10/20/50) | Ordenación/paginación en servidor |

### TC-CLB-02 · Filtrado por nombre de tarea

- **Prioridad:** Media · **Tipo:** Funcional · **Traza:** RF-CLB-2 (AC2.1–AC2.2) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`; identificar el nombre de un bloqueo existente (p. ej. `NODOS`).
- **Teardown:** logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Escribir parte del nombre en `cluster-blocks-filter-name` (insensible a mayúsculas) y pulsar `cluster-blocks-apply-filters` | El listado se reduce a las filas cuyo nombre coincide y vuelve a página 1 |

### TC-CLB-03 · Métricas visibles en el listado (sin pantalla de detalle)

- **Prioridad:** Media · **Tipo:** Funcional · **Traza:** RF-CLB-3 (AC3.1–AC3.3) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`; al menos una fila.
- **Teardown:** logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Observar una fila de `cluster-blocks-table` | La fila muestra nombre de tarea, fecha de inicio y las cuatro métricas (promedio, mínimo, máximo, total), sin controles de edición |
| 2 | Comprobar que no existe navegación a detalle | Seleccionar la fila no abre ninguna pantalla de detalle; no existe el botón `cluster-blocks-back-to-list` |

### TC-CLB-04 · Exportación CSV

- **Prioridad:** Media · **Tipo:** Funcional · **Traza:** RF-CLB-4 (AC4.1–AC4.4) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** login con `{{ADMIN_USER}}`.
- **Teardown:** eliminar el fichero descargado; logout.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Con filtros que devuelvan resultados, pulsar `cluster-blocks-export-csv` | Descarga `cluster_blocks_{{TODAY}}.csv` con todos los resultados filtrados, fechas en hora local y BOM UTF-8 |
| 2 | Filtrar por un nombre inexistente y exportar | Se notifica error y no se descarga ningún fichero |

### TC-CLB-05 · Gestión controlada por el sistema

- **Prioridad:** Alta · **Tipo:** Negativo, Seguridad, API · **Traza:** RF-CLB-5 (AC5.1–AC5.3) · **Independiente:** Sí · **Dependencias:** ninguna
- **Setup:** vía API con token de `{{ADMIN_USER}}`.
- **Teardown:** No aplica.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Observar la pantalla | No hay acciones de crear/editar/eliminar |
| 2 | `POST`/`PUT`/`PATCH`/`DELETE` sobre `/api/v1/administration/cluster/blocks` | 405 Method Not Allowed |
| 3 | Ejecutar una tarea clusterizada que adquiere y libera un lock | Se crea el registro la primera vez y se actualizan sus métricas (total, promedio, mínimo, máximo) en cada liberación |

---

## Matriz de trazabilidad (resumen)

| Módulo | Requisitos cubiertos | Test cases |
|--------|----------------------|------------|
| Login / Autenticación | RF-LOG-1..6, RF-AUT-1..5, RNF varios | TC-LOG-01..11 |
| Informes | RF-RPT-1..5, RNF-RPT-1..7 | TC-RPT-01..10 |
| Usuarios | RF-USR-1..7, RNF-USR-1..2 | TC-USR-01..10 |
| Perfiles | RF-PRO-1..7, RNF-PRO-1..3 | TC-PRO-01..09 |
| Acciones | RF-ACC-1..6, RNF-ACC-3 | TC-ACC-01..07 |
| Parámetros | RF-PAR-1..7, RNF-PAR-1..4 | TC-PAR-01..09 |
| Auditoría | RF-AUD-1..5, RNF-AUD-3..4 | TC-AUD-01..07 |
| Monitor interfaces | RF-IFM-1..4, RNF-IFM-1 | TC-IFM-01..08 |
| Config. interfaces | RF-CFG-1..5, RNF-CFG-1 | TC-CFG-01..06 |
| Nodos cluster | RF-CLN-1..6, RNF-CLN-2 | TC-CLN-01..07 |
| Bloqueos cluster | RF-CLB-1..5 | TC-CLB-01..05 |

## Casos con dependencias o condiciones especiales

La inmensa mayoría de casos son **independientes** (login y limpieza propios). Estos requieren atención del ejecutor:

| Caso | Condición | Cómo satisfacerla |
|------|-----------|-------------------|
| TC-RPT-06 | Reutiliza la ejecución de informe | El propio caso ejecuta el informe en su paso 1; no requiere otro caso previo |
| TC-RPT-09 | Token sin `REPORT_EXECUTE` | Crear usuario/perfil sin esa acción antes de ejecutar |
| TC-USR-05, TC-USR-06 | Necesitan un usuario que editar/eliminar | El setup crea `e2e_user_{{UNIQUE}}` por API antes de los pasos |
| TC-USR-10, TC-PRO-09, TC-PAR-09 | Tokens con permisos parciales | Preparar usuario/perfil de solo lectura antes de ejecutar |
| TC-PRO-04, TC-PRO-05 | Necesitan un perfil propio | El setup crea `e2e_profile_{{UNIQUE}}` por API antes de los pasos |
| TC-PAR-04, TC-PAR-05, TC-PAR-06, TC-PAR-07 | Necesitan un parámetro propio | El setup crea `E2E_PARAM_{{UNIQUE}}` por API antes de los pasos |
| TC-ACC-04 | Edita un registro semilla | El teardown restaura el valor original |
| TC-AUD-03 | 🔴 **BLOQUEADO**: discrepancia de contrato de fechas (sección 3.4), pendiente de revisión funcional y técnica | No ejecutar; desbloquear solo tras alinear `dateFrom/dateTo` ↔ `fromDate/toDate` y verificar de extremo a extremo |
| TC-CLN-04 | Modifica estado compartido; requiere ≥2 nodos activos | Ejecutar en entorno con dos nodos; el teardown restaura el maestro original |

## Notas de importación a Jira / OpenProject

- **Jira (Xray/Zephyr):** cada `TCY-*` → *Test Set / Test Cycle*; cada `TC-*` → *Test*. Los campos *Setup* y *Teardown* → *Preconditions* y *Post-conditions*; cada fila "Acción / Resultado esperado" → un *Test Step* (Action / Expected Result). El campo "Traza" alimenta el enlace *tests / is tested by* con el requisito. El campo "Dependencias" se mapea a un enlace *depends on* entre tests.
- **OpenProject:** cada `TCY-*` → categoría o versión; cada `TC-*` → work package tipo *Test case*; *Setup/Teardown* en campos propios o en la descripción; los pasos como checklist. "Traza" → relación *relates to* con requisitos; "Dependencias" → relación *follows / precedes*.
- Los nombres de fichero de exportación usan `{{TODAY}}`: en una aserción automática, comparar contra la fecha del día de ejecución, no contra una fecha fija.
- Los casos marcados `E2E` ya tienen cobertura Playwright documentada en la sección 4 de cada documento funcional; pueden enlazarse como automatización existente (Page Objects en `dashboard/e2e/pages/`, specs en `dashboard/e2e/tests/`).
- Los casos marcados `API` son idóneos para automatización sin navegador (REST client, colección Postman/newman o tests de contrato).

## Referencias

- [Documentación funcional (índice)](../02-functional/README.md)
- [Requisitos](requirements.md)
- [Glosario](glossary.md)
- [Reglas de documentación](../04-development/coding-guidelines/documentation.md)
- [Guía de testing](../04-development/coding-guidelines/testing.md)
- [Datos de prueba E2E](../../template/dashboard/e2e/fixtures/test-data.ts)
