# Plan Maestro de Pruebas (Test Strategy y Catálogo Global)

Documento central de **estrategia de pruebas**, **convenciones globales** y **catálogo de Test Cycles** del sistema.

Siguiendo el principio de proximidad documental y la estructura estándar del proyecto ([Reglas de Documentación](../04-development/coding-guidelines/documentation.md)), el detalle exhaustivo paso a paso de cada test case está descentralizado dentro de la sección **`4. Pruebas`** de cada documento funcional en [`02-functional/`](../02-functional/README.md). Este documento actúa como índice maestro, cuadro de mando de trazabilidad y guía de ejecución transversal para cualquier actor (persona, agente IA o automatización CI/CD), así como referencia de importación para herramientas de gestión de pruebas (**Jira Xray / Zephyr** u **OpenProject**).

Cada test case en su módulo funcional:

- Es **autocontenido**: incluye su precondición, los datos exactos a usar, los pasos accionables y la limpieza posterior.
- Declara su **independencia**: la mayoría son independientes y se autoabastecen (crean sus propios datos). Cuando un caso depende de otro, se indica de forma explícita en el campo *Dependencias*.
- Está **trazado** a los requisitos funcionales (`RF-*`) y no funcionales (`RNF-*`) del documento de origen.

---

## Cómo ejecutar los casos (cualquier actor)

### Modelo de ejecución de cada caso

Cada test case se estructura en cuatro bloques fijos para que un ejecutor automático o humano pueda parsearlo e interpretarlo:

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

---

## Catálogo e Índice de Test Cycles

A continuación se indexan todos los ciclos de prueba del sistema con enlace directo a sus casos de prueba detallados en la documentación funcional:

| ID Ciclo | Nombre | Módulo | Nº casos | Estado | Especificación funcional y Test Cases |
|----------|--------|--------|:--------:|:------:|---------------------------------------|
| **TCY-LOGIN** | Autenticación y acceso | Login | 11 | Activo | [Login · Casos detallados](../02-functional/login/login.md#46-casos-de-prueba-detallados-tcy-login) · [Autenticación](../02-functional/login/authentication.md#4-pruebas) |
| **TCY-RPT** | Informes | Informes | 10 | Activo | [Informes · Casos detallados](../02-functional/reports/reports.md#47-casos-de-prueba-detallados-tcy-rpt) |
| **TCY-USR** | Gestión de usuarios | Administración · Seguridad | 10 | Activo | [Usuarios · Casos detallados](../02-functional/administration/security/users.md#46-casos-de-prueba-detallados-tcy-usr) |
| **TCY-PRO** | Gestión de perfiles | Administración · Seguridad | 9 | Activo | [Perfiles · Casos detallados](../02-functional/administration/security/profiles.md#46-casos-de-prueba-detallados-tcy-pro) |
| **TCY-ACC** | Catálogo de acciones | Administración · Seguridad | 7 | Activo | [Acciones · Casos detallados](../02-functional/administration/security/actions.md#46-casos-de-prueba-detallados-tcy-acc) |
| **TCY-PAR** | Parámetros | Administración | 9 | Activo | [Parámetros · Casos detallados](../02-functional/administration/parameters/parameters.md#46-casos-de-prueba-detallados-tcy-par) |
| **TCY-AUD** | Auditoría | Administración | 7 | Activo (1 🔴 bloqueado) | [Auditoría · Casos detallados](../02-functional/administration/audit/audit.md#46-casos-de-prueba-detallados-tcy-aud) |
| **TCY-IFM** | Monitor de interfaces | Interfaces | 8 | Activo | [Monitor · Casos detallados](../02-functional/interfaces/monitor/monitor.md#47-casos-de-prueba-detallados-tcy-ifm) |
| **TCY-CFG** | Configuración de interfaces | Interfaces | 6 | Activo | [Configuración · Casos detallados](../02-functional/interfaces/configuration/configuration.md#46-casos-de-prueba-detallados-tcy-cfg) |
| **TCY-CLN** | Nodos del cluster | Administración · Cluster | 7 | Activo | [Nodos · Casos detallados](../02-functional/administration/cluster/cluster-nodes.md#46-casos-de-prueba-detallados-tcy-cln) |
| **TCY-CLB** | Bloqueos del cluster | Administración · Cluster | 5 | Activo | [Bloqueos · Casos detallados](../02-functional/administration/cluster/cluster-blocks.md#46-casos-de-prueba-detallados-tcy-clb) |

### Convención de independencia

- **Independiente:** el caso se ejecuta por sí solo (login propio incluido) sin requerir que otro caso se haya ejecutado antes. Es la norma general.
- **Depende de:** se lista el ID del caso del que depende y por qué. Un ejecutor automático debe programar primero la dependencia.
- Dentro de un mismo ciclo, cada caso hace su **propio login** y su **propia limpieza**, por lo que el orden de ejecución no importa salvo donde se declare lo contrario.

### Convención de estado

- Un caso sin campo *Estado* se considera **Activo**: listo para ejecutar.
- Un caso con **Estado: 🔴 BLOQUEADO** no debe ejecutarse: hay una revisión funcional o técnica pendiente que impide validarlo de extremo a extremo. El caso documenta el *motivo del bloqueo* y la *condición para desbloquear*. Un ejecutor automático debe **omitir** (skip) estos casos y reportarlos como no ejecutados, no como fallidos.

---

## Matriz de trazabilidad global (resumen)

| Módulo | Requisitos cubiertos | Test cases | Ubicación detallada |
|--------|----------------------|:----------:|---------------------|
| Login / Autenticación | RF-LOG-1..6, RF-AUT-1..5, RNF varios | TC-LOG-01..11 | [02-functional/login/login.md](../02-functional/login/login.md#46-casos-de-prueba-detallados-tcy-login) |
| Informes | RF-RPT-1..5, RNF-RPT-1..7 | TC-RPT-01..10 | [02-functional/reports/reports.md](../02-functional/reports/reports.md#47-casos-de-prueba-detallados-tcy-rpt) |
| Usuarios | RF-USR-1..7, RNF-USR-1..2 | TC-USR-01..10 | [02-functional/administration/security/users.md](../02-functional/administration/security/users.md#46-casos-de-prueba-detallados-tcy-usr) |
| Perfiles | RF-PRO-1..7, RNF-PRO-1..3 | TC-PRO-01..09 | [02-functional/administration/security/profiles.md](../02-functional/administration/security/profiles.md#46-casos-de-prueba-detallados-tcy-pro) |
| Acciones | RF-ACC-1..6, RNF-ACC-3 | TC-ACC-01..07 | [02-functional/administration/security/actions.md](../02-functional/administration/security/actions.md#46-casos-de-prueba-detallados-tcy-acc) |
| Parámetros | RF-PAR-1..7, RNF-PAR-1..4 | TC-PAR-01..09 | [02-functional/administration/parameters/parameters.md](../02-functional/administration/parameters/parameters.md#46-casos-de-prueba-detallados-tcy-par) |
| Auditoría | RF-AUD-1..5, RNF-AUD-3..4 | TC-AUD-01..07 | [02-functional/administration/audit/audit.md](../02-functional/administration/audit/audit.md#46-casos-de-prueba-detallados-tcy-aud) |
| Monitor interfaces | RF-IFM-1..4, RNF-IFM-1 | TC-IFM-01..08 | [02-functional/interfaces/monitor/monitor.md](../02-functional/interfaces/monitor/monitor.md#47-casos-de-prueba-detallados-tcy-ifm) |
| Config. interfaces | RF-CFG-1..5, RNF-CFG-1 | TC-CFG-01..06 | [02-functional/interfaces/configuration/configuration.md](../02-functional/interfaces/configuration/configuration.md#46-casos-de-prueba-detallados-tcy-cfg) |
| Nodos cluster | RF-CLN-1..6, RNF-CLN-2 | TC-CLN-01..07 | [02-functional/administration/cluster/cluster-nodes.md](../02-functional/administration/cluster/cluster-nodes.md#46-casos-de-prueba-detallados-tcy-cln) |
| Bloqueos cluster | RF-CLB-1..5 | TC-CLB-01..05 | [02-functional/administration/cluster/cluster-blocks.md](../02-functional/administration/cluster/cluster-blocks.md#46-casos-de-prueba-detallados-tcy-clb) |

---

## Casos con dependencias o condiciones especiales

La inmensa mayoría de casos son **independientes** (login y limpieza propios). Estos requieren atención específica del ejecutor:

| Caso | Condición | Cómo satisfacerla |
|------|-----------|-------------------|
| `TC-RPT-06` | Reutiliza la ejecución de informe | El propio caso ejecuta el informe en su paso 1; no requiere otro caso previo |
| `TC-RPT-09` | Token sin `REPORT_EXECUTE` | Crear usuario/perfil sin esa acción antes de ejecutar |
| `TC-USR-05`, `TC-USR-06` | Necesitan un usuario que editar/eliminar | El setup crea `e2e_user_{{UNIQUE}}` por API antes de los pasos |
| `TC-USR-10`, `TC-PRO-09`, `TC-PAR-09` | Tokens con permisos parciales | Preparar usuario/perfil de solo lectura antes de ejecutar |
| `TC-PRO-04`, `TC-PRO-05` | Necesitan un perfil propio | El setup crea `e2e_profile_{{UNIQUE}}` por API antes de los pasos |
| `TC-PAR-04`..`07` | Necesitan un parámetro propio | El setup crea `E2E_PARAM_{{UNIQUE}}` por API antes de los pasos |
| `TC-ACC-04` | Edita un registro semilla | El teardown restaura el valor original |
| `TC-AUD-03` | 🔴 **BLOQUEADO**: discrepancia de contrato de fechas (sección 3.4), pendiente de revisión funcional y técnica | No ejecutar; desbloquear solo tras alinear `dateFrom/dateTo` ↔ `fromDate/toDate` y verificar de extremo a extremo |
| `TC-CLN-04` | Modifica estado compartido; requiere ≥2 nodos activos | Ejecutar en entorno con dos nodos; el teardown restaura el maestro original |

---

## Notas de importación a Jira / OpenProject

- **Jira (Xray/Zephyr):** cada `TCY-*` → *Test Set / Test Cycle*; cada `TC-*` → *Test*. Los campos *Setup* y *Teardown* → *Preconditions* y *Post-conditions*; cada fila "Acción / Resultado esperado" → un *Test Step* (Action / Expected Result). El campo "Traza" alimenta el enlace *tests / is tested by* con el requisito. El campo "Dependencias" se mapea a un enlace *depends on* entre tests.
- **OpenProject:** cada `TCY-*` → categoría o versión; cada `TC-*` → work package tipo *Test case*; *Setup/Teardown* en campos propios o en la descripción; los pasos como checklist. "Traza" → relación *relates to* con requisitos; "Dependencias" → relación *follows / precedes*.
- Los nombres de fichero de exportación usan `{{TODAY}}`: en una aserción automática, comparar contra la fecha del día de ejecución, no contra una fecha fija.
- Los casos marcados `E2E` ya tienen cobertura Playwright documentada en la sección 4 de cada documento funcional; pueden enlazarse como automatización existente (Page Objects en `dashboard/e2e/pages/`, specs en `dashboard/e2e/tests/`).
- Los casos marcados `API` son idóneos para automatización sin navegador (REST client, colección Postman/newman o tests de contrato).

---

## Referencias

- [Documentación funcional (índice)](../02-functional/README.md)
- [Requisitos](requirements.md)
- [Glosario](glossary.md)
- [Reglas de documentación](../04-development/coding-guidelines/documentation.md)
- [Guía de testing](../04-development/coding-guidelines/testing.md)
- [Datos de prueba E2E](../../template/dashboard/e2e/fixtures/test-data.ts)
