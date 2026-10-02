---
name: architecture-guardrails
description: Enforces the project architecture, module boundaries, business validation, and minimal-scope workflow for the Java + Angular template.
---

# Skill: architecture-guardrails

Refuerza la arquitectura modular al tocar cualquier módulo. La separación por capas, el mapa de responsabilidades por módulo y los principios generales (no dependencias cruzadas, no tocar `target/`, alcance mínimo, tests si cambia negocio, checklist final) ya están en `AGENTS.md`. Este skill no los repite: solo refuerza el criterio de decisión de capa y el flujo de trabajo.

## Criterio de decisión de capa

Antes de editar, identifica en qué capa está la responsabilidad real (consulta el mapa de módulos en `AGENTS.md`). Si el cambio encaja mejor en otra capa, muévelo allí; no lo dejes en presentación (`dashboard`) ni en integración (`webapp`/`ws`) por comodidad.

## Flujo

1. Localiza el punto exacto del cambio y mantén el alcance mínimo.
2. Revisa si obliga a ajustar tests, API, modelos o UI en ese mismo módulo.
3. Evita reescribir módulos completos cuando basta un punto concreto.
4. Si cambia un contrato, revisa también los consumidores implicados.
5. Verifica con la validación mínima del área afectada (`mvn test -pl <modulo> -am` desde `template/`, o `ng test` desde `template/dashboard/`).

## Referencia

`AGENTS.md`, `template-docs/04-development/coding-guidelines.md` y `template-docs/04-development/build.md`.
