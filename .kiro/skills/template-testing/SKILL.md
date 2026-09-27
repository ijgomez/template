---
name: template-testing
description: Encourages the smallest real verification for business and code changes, with emphasis on test quality and regression prevention.
---

# Skill: template-testing

Aplica al cambiar comportamiento funcional, resolver un bug o ajustar un contrato. Las reglas transversales están en `AGENTS.md`.

## Principio

Valida el cambio con la prueba más cercana que capture el comportamiento real afectado. No des por resuelto un cambio solo por intuición.

## Específico de testing

- Cubre comportamiento funcional visible, flujos de error/validación e integración cuando aplique; no solo mocks ni detalles internos.
- Alcance mínimo: valida el módulo afectado, no lances suites completas si un nivel más local basta.
- Pruebas que describen comportamiento, no implementación, con datos realistas.
- Si el cambio afecta API o contratos, verifica el comportamiento esperado de esos contratos.

## Referencia

Estrategia y herramientas de test: `template-docs/04-development/coding-guidelines/testing.md` (se carga vía steering `coding-testing`) y `template-docs/04-development/build.md`.
