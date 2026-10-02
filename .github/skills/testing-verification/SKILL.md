---
name: testing-verification
description: Encourages the smallest real verification for business and code changes, with emphasis on test quality and regression prevention.
---

# Skill: testing-verification

Aplica al cambiar comportamiento funcional, resolver un bug o ajustar un contrato. Las reglas transversales están en [AGENTS.md](../../../AGENTS.md).

## Principio

Valida el cambio con la prueba más cercana que capture el comportamiento real afectado. No des por resuelto un cambio solo por intuición.

## Específico de testing

- Cubre comportamiento funcional visible, flujos de error/validación e integración cuando aplique; no solo mocks ni detalles internos.
- Alcance mínimo: valida el módulo afectado, no lances suites completas si un nivel más local basta.
- Pruebas que describen comportamiento, no implementación, con datos realistas.
- Si el cambio afecta API o contratos, verifica el comportamiento esperado de esos contratos.

## Comandos

Desde `template/`, limita los tests al módulo afectado con `-pl <modulo> -am` (p. ej. `core`, `domain`, `ws`):

```bash
mvn test -pl core -am
```

Para el frontend, desde `template/dashboard/`:

```bash
ng test
```

## Referencia

Estrategia y herramientas de test: [testing.md](../../../template-docs/04-development/coding-guidelines/testing.md) y [build.md](../../../template-docs/04-development/build.md).
