---
name: template-guardrails
description: Enforces the project architecture, module boundaries, business validation, and minimal-scope workflow for the Java + Angular template.
---

# Skill: template-guardrails

Aplica estas reglas cuando trabajes en este repositorio y modifiques código en cualquiera de sus módulos: `template`, `commons`, `cluster`, `domain`, `core`, `ws`, `webapp` o `dashboard`.

## Principios arquitectónicos obligatorios

- Mantener la separación por capas: dominio, core, web y UI.
- Priorizar soluciones simples y mantenibles sobre refactorizaciones amplias.
- No introducir dependencias cruzadas innecesarias entre módulos.
- No mezclar lógica de negocio en capas equivocadas.
- Mantener seguridad, auditoría y trazabilidad en servicios y endpoints.
- No tocar artefactos generados ni ficheros de build manualmente, especialmente `target/`.

## Regla de ubicación por módulo

- `domain`: modelo, persistencia y reglas de dominio.
- `core`: lógica de negocio y casos de uso.
- `webapp` / `ws`: integración y capa HTTP/API.
- `dashboard`: frontend Angular y capas de presentación.
- `commons`: utilidades transversales, sólo si no introducen dependencias de dominio o negocio.
- `cluster`: coordinación, alta disponibilidad y soporte de infraestructura.

Antes de editar, identifica exactamente en qué capa está la responsabilidad real del cambio. Si el cambio encaja mejor en otra capa, mueve el trabajo allí y no lo dejes en una capa de presentación o de integración por comodidad.

## Cambios de negocio

Si el cambio afecta comportamiento de negocio, haz lo siguiente:

- añade o actualiza pruebas relevantes del módulo afectado
- valida que el flujo continúa funcionando en el nivel mínimo necesario
- evita cambios ocultos o supresiones de validación sin justificación clara
- documenta si el cambio altera contratos, API o comportamientos esperados

## Workflow recomendado

1. Localiza el punto exacto del cambio.
2. Mantén el alcance mínimo.
3. Revisa si la corrección requiere ajustar tests, API, modelos o UI en ese mismo módulo.
4. Evita reescribir módulos completos cuando el problema puede resolverse en un punto concreto.
5. Verifica con la prueba o validación mínima del área afectada.

## Reglas de calidad

- No añadas dependencias nuevas si ya existe una solución simple dentro del marco del proyecto.
- No ocultes errores ni silencies de compilación o validaciones sin una justificación técnica.
- Si hay un cambio de contrato, revisa también los consumidores implicados.
- Sé conservador con refactors grandes; sólo haz los necesarios para resolver el problema real.

## Validación mínima requerida

- Para backend: usa la prueba unitaria o de integración más cercana al cambio y evita ejecutar suites innecesarias.
- Para frontend: valida el componente o flujo afectado, preferiblemente con pruebas del módulo.
- Si es un cambio de integración o seguridad, comprueba también la ruta real afectada.

## Checklist antes de terminar

- El cambio respeta la separación por capas.
- No se ha introducido acoplamiento cruzado innecesario.
- La solución es simple y mantenible.
- Se han añadido o actualizado pruebas relevantes.
- No se han dejado artefactos generados ni cambios de build manuales.
- La validación mínima ha sido ejecutada y el resultado es aceptable.

## Referencias del repositorio

- [AGENTS.md](../../../AGENTS.md)
- [.github/copilot-instructions.md](../../copilot-instructions.md)
- [template-docs/README.md](../../../template-docs/README.md)
- [template-docs/04-development/coding-guidelines.md](../../../template-docs/04-development/coding-guidelines.md)
- [template-docs/04-development/build.md](../../../template-docs/04-development/build.md)
