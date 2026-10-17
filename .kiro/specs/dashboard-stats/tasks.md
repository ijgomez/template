# Estadísticas del Dashboard — Tareas

> Estado: Borrador (pendiente de implementar)
> Feature: `dashboard-stats`
> Cada tarea referencia los requisitos (RF/RNF) que cubre.

## Fase 1 — Backend: endpoint de resumen (opción recomendada)

- [ ] 1.1 Definir `DashboardStatsDTO` (users, interfaces, reports) con campos
      opcionales y `trend`/`period`. (Diseño §2.1)
- [ ] 1.2 Servicio de negocio en `core` que agrega los conteos reutilizando los
      repositorios/consultas existentes. (RNF-1)
- [ ] 1.3 Endpoint `GET /dashboard/stats` en la capa web que delega en `core`
      (sin logica en el controlador). (Diseño §2.1)
- [ ] 1.4 Regla en `SecurityConfig`: `/dashboard/stats` con `DASHBOARD_READ`;
      cada bloque calculado segun el permiso de su entidad. (RF-5, RNF-2)
- [ ] 1.5 Tests backend: unitario del servicio de agregacion y de controlador
      (MockMvc) con y sin permisos. (coding-testing)

## Fase 2 — Frontend: servicio y modelo

- [ ] 2.1 `DashboardStats` (modelo) en `core/models`. (Diseño §2.3)
- [ ] 2.2 `DashboardStatsService.getStats()` → `GET /dashboard/stats`,
      con `catchError`. (RF-4)
- [ ] 2.3 Tests del servicio (`HttpTestingController`). (coding-angular)

## Fase 3 — Frontend: consumo en el dashboard

- [ ] 3.1 Refactor de `DashboardComponent`: signals por tarjeta
      (loading/error/valor) replicando el patron de la tarjeta de nodos. (RF-4)
- [ ] 3.2 Usuarios: mostrar total real; mostrar tendencia SOLO si llega `trend`
      no nulo. (RF-1)
- [ ] 3.3 Interfaces: total real + numero en error. (RF-2)
- [ ] 3.4 Informes: total del periodo + periodo explicito desde backend. (RF-3)
- [ ] 3.5 Estados con icono + texto (no solo color), coherente con la mejora de
      accesibilidad ya aplicada. (RF-4)
- [ ] 3.6 i18n del periodo y textos auxiliares en es.json/en.json simetricas;
      verificar con `translation-completeness.property.spec.ts`. (RNF-3)
- [ ] 3.7 Actualizar/crear tests de `DashboardComponent` para los tres bloques
      (carga/error/dato) sin datos hardcodeados. (coding-angular)

## Fase 4 — Alternativa (si no se aborda el backend de inmediato)

- [ ] 4.1 En su lugar, `DashboardComponent` reutiliza `countByCriteria` por
      entidad en paralelo (`forkJoin`), omitiendo la tendencia. (Diseño §3)
- [ ] 4.2 Marcar en el codigo que es un puente hasta el endpoint `/dashboard/stats`.

## Dependencias y notas

- La tarjeta de nodos del cluster ya consume datos reales y es el **patron de
  referencia** para estados de carga/error.
- **No** reintroducir datos hardcodeados ni claves i18n de ejemplo (se eliminaron
  al retirar la tabla 'Recent activity').
- La visualizacion de tendencia (sparkline) queda **fuera de alcance** hasta que
  existan datos reales (ver requirements, Fuera de alcance).
- Sin dependencias nuevas (RNF-4).
