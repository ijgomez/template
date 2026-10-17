# Estadísticas del Dashboard — Requisitos

> Estado: Borrador (pendiente de implementar)
> Feature: `dashboard-stats`
> Ámbito: Frontend Angular (`template/dashboard`) + endpoints de backend

## Contexto

El dashboard muestra cuatro tarjetas de estadísticas (stat-cards). Actualmente
solo una tiene datos reales; las otras tres están **hardcodeadas** en el
componente, lo que constituye el anti-patrón de "datos de ejemplo que aparentan
ser reales".

Estado actual de las tarjetas (`features/dashboard/dashboard.component.html` / `.ts`):

| Tarjeta              | Valor mostrado                 | Origen actual                  |
|----------------------|--------------------------------|--------------------------------|
| Usuarios activos     | `148`, `+12% vs mes anterior`  | **Hardcodeado**                |
| Nodos del cluster    | activos / total                | **Real** (`ClusterService.findAllNodes`) |
| Interfaces           | `12`, `1 con error`            | **Hardcodeado**                |
| Informes generados   | `56`, `este mes`               | **Hardcodeado**                |

Este documento define el backend y el consumo en frontend para que las tres
tarjetas hardcodeadas muestren datos reales. La tarjeta de nodos del cluster ya
funciona y sirve de patrón de referencia.

## Objetivo

Sustituir los datos hardcodeados de las stat-cards por datos reales del backend,
con estados de carga/error consistentes con la tarjeta de nodos del cluster, sin
introducir dependencias nuevas en el frontend.

## Requisitos funcionales

### RF-1 — Usuarios activos
- La tarjeta muestra el número real de usuarios (y, si procede, cuántos activos).
- El indicador de tendencia ("+12% vs mes anterior") **solo se muestra si el
  backend proporciona un dato de comparación real**; si no existe, no se muestra
  (no inventar porcentajes).

### RF-2 — Interfaces
- La tarjeta muestra el número real de interfaces configuradas y cuántas están
  en estado de error.

### RF-3 — Informes generados
- La tarjeta muestra el número real de informes generados en el periodo indicado
  (p. ej. el mes actual). El periodo debe ser explícito y provenir del backend.

### RF-4 — Estados visibles
- Cada tarjeta gestiona, de forma independiente, los estados: **cargando**
  (spinner), **error** (valor `-` + mensaje), y **dato disponible**. Mismo patrón
  que la tarjeta de nodos del cluster ya implementada.

### RF-5 — Permisos
- Cada tarjeta se consulta/renderiza solo si el usuario tiene el permiso de
  lectura correspondiente; si no, la tarjeta no se muestra o muestra "sin acceso"
  de forma coherente con el resto del dashboard.

## Requisitos no funcionales

### RNF-1 — Rendimiento
- Preferir un único endpoint de resumen del dashboard (`GET /dashboard/stats`)
  frente a múltiples llamadas de conteo, para una sola petición al cargar.
- Alternativa aceptable en una primera iteración: reutilizar los
  `countByCriteria` existentes por entidad (ver diseño).

### RNF-2 — Seguridad
- El endpoint de estadísticas aplica los mismos permisos que las entidades
  subyacentes (deny by default, coherente con `SecurityConfig`).
- No exponer datos sensibles; solo agregados numéricos.

### RNF-3 — Internacionalización
- El periodo y los textos auxiliares mediante claves i18n en `es.json` y
  `en.json` (simétricas). No reintroducir claves de datos de ejemplo.

### RNF-4 — Sin dependencias nuevas
- Angular 22 + Bootstrap 5.3.8 + RxJS. Backend con el stack actual (Spring Boot).

## Fuera de alcance

- Visualización de tendencia (sparkline/gráfico): se valorará **después** de tener
  datos reales, en una iteración posterior. Sin datos reales no se añade.
- Series temporales históricas; esta iteración cubre agregados puntuales.

## Referencias

- Patrón de tarjeta con datos reales y estados: tarjeta de nodos del cluster en
  `features/dashboard/dashboard.component.*` (`nodesLoading`, `nodesError`,
  `activeNodes`, `totalNodes`).
- Conteos existentes reutilizables: `UserService.countByCriteria`,
  `InterfaceService` (conteo de configuraciones/errores), `ReportService`.
