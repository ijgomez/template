---
name: template-testing
description: Encourages the smallest real verification for business and code changes, with emphasis on test quality and regression prevention.
---

# Skill: template-testing

Aplica esta skill cada vez que vayas a cambiar comportamiento funcional, resolver un bug, añadir una funcionalidad o ajustar un contrato de la aplicación.

## Principio general

No se da por resuelto un cambio solo por la intuición. El cambio debe validarse con la prueba más cercana que capture el comportamiento real afectado.

## Reglas obligatorias

- Antes de modificar el código, identifica el comportamiento que debe mantenerse o cambiar.
- Si el cambio afecta negocio, añade o actualiza pruebas relevantes.
- Si no existe prueba para ese comportamiento, crea la mínima prueba que lo cubra.
- No pruebes mocks o implementaciones artificiales como sustituto del comportamiento real.
- Prioriza validación real sobre cobertura superficial.

## Qué debe cubrir la prueba

- Comportamiento funcional visible del cambio
- Flujos de error o validación si aplica
- Integración con servicios, API o persistencia cuando el cambio lo requiera
- Regressions en el área afectada, no en todo el proyecto

## Reglas de alcance

- No ejecutes suites masivas si el problema puede validarse con un nivel más local.
- El objetivo es validar el módulo afectado, no “hacer más pruebas por hacerlas”.
- Si el cambio es pequeño, la prueba mínima puede ser una unit test o una prueba de integración enfocada.
- Si el cambio es grande o transversal, usa un alcance mayor pero mantenido y justificado.

## Buenas prácticas

- Haz pruebas que describan el comportamiento y no el detalle de implementación.
- Evita la lógica de prueba basada en supuestos internos del código.
- Usa datos realistas para los escenarios.
- Cuando los cambios afectan API o contratos, incluye verificación del comportamiento esperado en esos contratos.

## Checklist antes de terminar

- El cambio tiene evidencia de validación.
- Se han ejecutado las pruebas mínimas relevantes.
- La prueba cubre el comportamiento real afectado.
- No se ha añadido código de prueba que solo valide mocks o detalles internos.
- El resultado de la comprobación confirma que no se ha roto el comportamiento esperado.

## Referencias del repositorio

- [AGENTS.md](../../../AGENTS.md)
- [.github/copilot-instructions.md](../../copilot-instructions.md)
- [template-docs/README.md](../../../template-docs/README.md)
- [template-docs/04-development/testing.md](../../../template-docs/04-development/testing.md)
- [template-docs/04-development/build.md](../../../template-docs/04-development/build.md)
