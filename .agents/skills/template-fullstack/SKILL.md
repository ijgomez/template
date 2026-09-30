---
name: template-fullstack
description: Coordinates backend, frontend, architecture guardrails, and verification steps for end-to-end changes across Java and Angular modules.
---

# Skill: template-fullstack

Aplica en cambios end-to-end que tocan backend y frontend a la vez (un caso de uso, un bug transversal). Los principios generales están en `AGENTS.md`; este skill coordina el reparto entre capas y la validación conjunta.

## Reparto por capa

- `domain`: reglas y persistencia.
- `core`: casos de uso y negocio.
- `webapp` / `ws`: API y adaptadores de entrada/salida.
- `dashboard`: presentación y UI (componentes delegan lógica a servicios).

## Flujo end-to-end

1. Decide qué capas afecta el cambio (backend, frontend o ambos) y coloca cada pieza en su capa.
2. Mantén el cambio lo más local posible.
3. Si modifica contratos/modelos/validaciones, propaga la revisión a todos los consumidores (incluida la API que consume el frontend).
4. Añade o actualiza las pruebas relevantes en cada módulo afectado.
5. Valida la **integración real del flujo completo**, no solo una capa por separado.

## Referencias

- Para el detalle por área usa los skills `template-backend`, `template-ui` y `template-testing`.
- Guía de convenciones: `template-docs/04-development/coding-guidelines.md`
