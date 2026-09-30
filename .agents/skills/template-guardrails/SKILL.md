---
name: template-guardrails
description: Enforces project architecture, module boundaries, business validation, and minimal-scope workflow for the Java and Angular template.
---

# Skill: template-guardrails

Refuerza la arquitectura modular al tocar cualquier módulo. Los principios generales (separación por capas, no dependencias cruzadas, no tocar `target/`, alcance mínimo, tests si cambia negocio, checklist final) ya están en `AGENTS.md`; este skill concreta la ubicación de responsabilidades y el flujo de trabajo.

## Responsabilidad por módulo

- `domain`: modelo, persistencia y reglas de dominio.
- `core`: lógica de negocio y casos de uso.
- `webapp` / `ws`: integración y capa HTTP/API.
- `dashboard`: frontend Angular y presentación.
- `commons`: utilidades transversales, sin dependencias de dominio o negocio.
- `cluster`: coordinación, alta disponibilidad e infraestructura.

Antes de editar, identifica en qué capa está la responsabilidad real. Si encaja mejor en otra capa, mueve el trabajo allí; no lo dejes en presentación o integración por comodidad.

## Flujo de trabajo

1. Localiza el punto exacto del cambio y mantén el alcance mínimo.
2. Revisa si obliga a ajustar tests, API, modelos o UI en ese mismo módulo.
3. Evita reescribir módulos completos cuando basta un punto concreto.
4. Si cambia un contrato, revisa también los consumidores implicados.
5. Verifica con la validación mínima del área afectada.

## Referencias

- Reglas generales: `AGENTS.md`
- Guías de código: `template-docs/04-development/coding-guidelines.md`
- Compilación: `template-docs/04-development/build.md`
