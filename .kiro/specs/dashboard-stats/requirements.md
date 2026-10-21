# Requirements Document

> Estado: Borrador (pendiente de implementar)
> Feature: `dashboard-stats`
> Ámbito: Frontend Angular (`template/dashboard`) + endpoints de backend

## Introduction

Estadísticas del Dashboard: convertir el dashboard, hoy lleno de datos
hardcodeados, en un overview fiable del estado del sistema para el
administrador/operador. Este documento recoge el contexto de la auditoría, el
objetivo y los requisitos funcionales y no funcionales para que las tarjetas,
el panel de estado y la cabecera muestren datos reales del backend o de
configuración, con estados de carga/error consistentes, excepciones accionables,
jerarquía de información e indicación de frescura.

## Glossary

| Término              | Definición                                                                                     |
|----------------------|------------------------------------------------------------------------------------------------|
| Stat-card            | Tarjeta de estadística del dashboard que muestra un KPI (usuarios, nodos, interfaces, informes).|
| Dato hardcodeado     | Valor fijo escrito en el componente o el HTML que aparenta ser real sin proceder del backend.  |
| Nodo máster          | Nodo del cluster con `master === true` (`ClusterService.findAllNodes`).                        |
| Uptime               | Tiempo en servicio, derivado de `startedAt` del nodo máster.                                    |
| Frescura             | Antigüedad de los datos mostrados ("actualizado hace X"), referida al estado del sistema.       |
| Drill-down           | Navegación desde una señal (excepción) hacia su vista de detalle.                              |
| Excepción accionable | Señal de error/degradación que enlaza a su detalle en lugar de mostrarse como texto inerte.     |
| DASHBOARD_READ       | Permiso de lectura requerido para acceder a la ruta `/dashboard`.                               |

## Contexto

El dashboard (`features/dashboard/`) es la **página de inicio** de la aplicación
(ruta `/dashboard`, permiso `DASHBOARD_READ`, destino de la redirección por
defecto). Su rol real es **estratégico / landing**: un vistazo al estado del
sistema más accesos rápidos. No es (todavía) un panel operacional de
monitorización en vivo, pese a que el producto se describe como plataforma con
"supervisión de interfaces" y "monitorización de entornos en alta disponibilidad".

Una auditoría de diseño (skill `design-dashboards`, Modo 1 + workflow operacional)
detectó que **el dashboard no es hoy un instrumento de decisión fiable**: la
mayoría de las cifras que muestra son datos hardcodeados que aparentan ser reales.

### Estado actual — stat-cards

El dashboard muestra cuatro tarjetas de estadísticas (stat-cards). Solo una tiene
datos reales; las otras tres están **hardcodeadas** en el componente, lo que
constituye el anti-patrón de "datos de ejemplo que aparentan ser reales".

| Tarjeta              | Valor mostrado                 | Origen actual                  |
|----------------------|--------------------------------|--------------------------------|
| Usuarios activos     | `148`, `+12% vs mes anterior`  | **Hardcodeado**                |
| Nodos del cluster    | activos / total                | **Real** (`ClusterService.findAllNodes`) |
| Interfaces           | `12`, `1 con error`            | **Hardcodeado**                |
| Informes generados   | `56`, `este mes`               | **Hardcodeado**                |

### Estado actual — panel "Estado del sistema" y cabecera

Además de las tarjetas, el dashboard incluye:

- Panel **"Estado del sistema"** con versión (`1.0.0`), entorno (`LOCAL`), nodo
  máster (`node-01`) y uptime (`14d 6h 32m`): **todo hardcodeado en el HTML**.
- Panel **"Accesos rápidos"** (shortcuts): enlaces a usuarios, informes y
  configuración. Funcional, pero al mismo nivel visual que el estado del sistema.
- Cabecera con **"último acceso"** (`lastAccess = '04/08/2026 19:15'`):
  **hardcodeado** en el componente.

### Problemas detectados por la auditoría (resumen)

1. **Datos falsos que aparentan reales** (crítico): usuarios, interfaces,
   informes y panel de estado. La tarjeta de interfaces incluso simula una alerta
   real ("1 con error" en rojo). Un dashboard que miente sobre un error erosiona
   la confianza en todo lo demás.
2. **Panel "Estado del sistema" totalmente estático**: entorno, máster y uptime
   son la información con la que un operador se orienta, y hoy es ficción (el
   máster y el uptime del nodo sí existen en backend).
3. **El error de interfaces no es accionable ni navegable**: no dice cuál, no
   enlaza al monitor `/interfaces`, no indica severidad ni frescura.
4. **Jerarquía plana**: las cuatro tarjetas pesan lo mismo, cuando un nodo caído o
   una interfaz en error son señales de acción y el nº de informes es contexto de
   bajo valor.
5. **"Informes generados" de dudoso valor y no calculable**: `ReportService`
   expone un catálogo de informes, no un histórico de *ejecuciones* con fecha;
   "informes generados este mes" no es consultable sin crear modelo nuevo.
6. **Sin frescura ni refresco**: no hay "actualizado hace X", ni recarga, ni
   auto-refresh; no se sabe si el estado mostrado es actual.
7. **KPIs sin contexto comparativo** (umbral/objetivo/tendencia).
8. **"Último acceso" hardcodeado y ambiguo** en la cabecera.

Este documento define el backend y el consumo en frontend para que el dashboard
muestre **datos reales** y se convierta en un instrumento de decisión. La tarjeta
de nodos del cluster ya funciona y sirve de **patrón de referencia** para estados
de carga/error y para el uso de color con significado reforzado con icono+texto.

## Objetivo

Convertir el dashboard en un **overview fiable del estado del sistema** para el
administrador/operador:

1. Sustituir todos los datos hardcodeados (stat-cards, panel de estado, cabecera)
   por datos reales del backend o de configuración.
2. Gestionar estados de carga/error/dato por bloque, de forma consistente con la
   tarjeta de nodos del cluster.
3. Hacer **accionables** las excepciones (interfaz en error, nodo degradado):
   enlazar a su detalle.
4. Reorganizar la **jerarquía** para que la señal de decisión destaque y el
   contexto quede subordinado.
5. Indicar la **frescura** de los datos y permitir recargar.

Todo ello sin introducir dependencias nuevas en el frontend y respetando la
arquitectura del proyecto.

## Requirements

### Requisitos funcionales

### RF-1 — Usuarios
- La tarjeta muestra el número real de usuarios (y, si procede, cuántos activos).
- El indicador de tendencia ("+12% vs mes anterior") **solo se muestra si el
  backend proporciona un dato de comparación real**; si no existe, no se muestra
  (no inventar porcentajes).

### RF-2 — Interfaces
- La tarjeta muestra el número real de interfaces configuradas y cuántas están
  en estado de error.
- Fuente disponible hoy: `InterfaceService.findAllConfigurations()` devuelve el
  `status` de cada interfaz (`ACTIVE` / `INACTIVE` / `ERROR`).

### RF-3 — Informes
- Si se conserva un KPI de informes, debe mostrar un dato real con periodo
  explícito proveniente del backend.
- **Advertencia de viabilidad**: el backend **no puede calcular hoy** "informes
  generados en el periodo". `ReportService` expone un catálogo
  (`findAll`, `search`), no un histórico de ejecuciones con fecha. Mientras no
  exista modelo de ejecuciones (entidad + migración + servicio + endpoint), esta
  métrica **se elimina del overview** en lugar de mostrarse hardcodeada.

### RF-4 — Estados visibles
- Cada tarjeta/panel con datos del backend gestiona, de forma independiente, los
  estados: **cargando** (spinner), **error** (valor `-` + mensaje), y **dato
  disponible**. Mismo patrón que la tarjeta de nodos del cluster ya implementada.

### RF-5 — Permisos
- Cada tarjeta se consulta/renderiza solo si el usuario tiene el permiso de
  lectura correspondiente; si no, la tarjeta no se muestra o muestra "sin acceso"
  de forma coherente con el resto del dashboard.

### RF-6 — Panel "Estado del sistema" con datos reales
- El panel deja de estar hardcodeado:
  - **Entorno**: desde `environment.ts` (campo `profile`).
  - **Nodo máster**: el nodo con `master === true` de `ClusterService.findAllNodes()`.
  - **Uptime**: derivado de `startedAt` del nodo máster.
  - **Versión**: solo si existe una fuente real; si no, se retira o se marca
    explícitamente como no disponible (no inventar).

### RF-7 — Excepciones accionables y navegables
- Toda señal de excepción enlaza a su detalle, sin obligar a buscar a ciegas:
  - **Interfaces en error** → navega a `/interfaces` (idealmente prefiltrado por
    `status=ERROR`).
  - **Nodos degradados** → navega a la vista de nodos del cluster
    (`/administration/cluster/...`).
- Preferir **datos clicables** frente a bandas de botones separadas.

### RF-8 — Frescura y recarga
- El dashboard indica la **frescura** de los datos mostrados ("actualizado hace X")
  y ofrece una acción de **recargar**.
- El dato de "frescura" se refiere a los datos del sistema, no al "último acceso"
  del usuario (que es un concepto distinto, ver RF-10).

### RF-9 — Jerarquía de la información
- La zona superior (superior-izquierda) se reserva a las **señales de salud del
  sistema** (nodos, interfaces en error) con el mayor contraste.
- Las métricas de **contexto** (p. ej. total de usuarios) quedan en una zona
  secundaria, visualmente más discreta.
- El panel "Estado del sistema" y los "Accesos rápidos" descienden a **chrome
  subordinado**.
- Con todo sano, la zona de salud permanece **silenciosa** (sin colores de
  alarma); la excepción destaca por escasez.

### RF-10 — "Último acceso" real o retirado
- El valor "último acceso" de la cabecera deja de estar hardcodeado: se toma del
  perfil/sesión del usuario o se retira de la cabecera.

## Requisitos no funcionales

### RNF-1 — Rendimiento
- Preferir un único endpoint de resumen del dashboard (`GET /dashboard/stats`)
  frente a múltiples llamadas de conteo, para una sola petición al cargar.
- Alternativa aceptable en una primera iteración: reutilizar los
  `countByCriteria` existentes por entidad (ver diseño).

### RNF-2 — Seguridad
- El endpoint de estadísticas aplica los mismos permisos que las entidades
  subyacentes (deny by default, coherente con `SecurityConfig`).
- No exponer datos sensibles; solo agregados numéricos y metadatos de estado.

### RNF-3 — Internacionalización
- El periodo y los textos auxiliares mediante claves i18n en `es.json` y
  `en.json` (simétricas). No reintroducir claves de datos de ejemplo.

### RNF-4 — Sin dependencias nuevas
- Angular 22 + Bootstrap 5.3.8 + RxJS. Backend con el stack actual (Spring Boot).

### RNF-5 — Accesibilidad
- Los estados y severidades no dependen solo del color: se refuerzan con icono y
  texto (coherente con la tarjeta de nodos ya implementada).

## Incertidumbres (requieren decisión antes del rediseño final)

Estas dos preguntas pueden cambiar sustancialmente el diseño y no se deducen del
código:

1. **Usuario objetivo y cadencia de uso.** Por los accesos rápidos (gestionar
   usuarios, informes, configuración) y el permiso `DASHBOARD_READ` parece un
   **administrador/operador**, pero no hay documento de decisión que lo confirme.
   Si el usuario deja el dashboard abierto monitorizando → hay que añadir
   auto-refresh y tratarlo como dashboard operacional en vivo. Si lo mira
   esporádicamente al entrar → basta con frescura + recarga manual (RF-8).
2. **¿"Informes generados" es un requisito de negocio real?** Si no lo es, se
   elimina (no es calculable sin modelo nuevo, RF-3). Si lo es, el histórico de
   ejecuciones de informes se planifica como evolutivo aparte.

## Fuera de alcance

- Visualización de tendencia (sparkline/gráfico): se valorará **después** de tener
  datos reales, en una iteración posterior. Sin datos reales no se añade.
- Series temporales históricas; esta iteración cubre agregados puntuales.
- **Histórico de ejecuciones de informes** (modelo de datos nuevo): fuera de
  alcance de esta spec; es un evolutivo aparte y condición para RF-3.
- **Auto-refresh en vivo**: condicionado a la decisión de cadencia (incertidumbre
  1); si se confirma uso operacional continuo, se trata en iteración posterior.

## Referencias

- Patrón de tarjeta con datos reales y estados: tarjeta de nodos del cluster en
  `features/dashboard/dashboard.component.*` (`nodesLoading`, `nodesError`,
  `activeNodes`, `totalNodes`, `allNodesOperational`).
- Conteos existentes reutilizables: `UserService.countByCriteria`,
  `InterfaceService.findAllConfigurations` (estado por interfaz),
  `AuditService.countByCriteria`.
- Datos de cluster para el panel de estado: `ClusterService.findAllNodes`
  (`ClusterNode.master`, `ClusterNode.startedAt`).
- Rutas de drill-down: `/interfaces` (monitor), `/administration/cluster`
  (nodos), definidas en `app.routes.ts`.
