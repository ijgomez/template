# Reglas de Testing

Aplica a pruebas unitarias, de integración y E2E en backend (`JUnit 5`, `Mockito`, `AssertJ`) y frontend (`Jasmine`, `Karma` / `Playwright`).

## Principios y Convenciones

- Valida cambios de comportamiento funcional con la prueba más cercana que capture el escenario real.
- Pruebas unitarias para lógica de negocio en `core` y servicios del `dashboard`.
- Pruebas de integración con Spring Boot Test y Testcontainers para persistencia y endpoints.
- Evitar pruebas frágiles acopladas a detalles internos de implementación; priorizar pruebas orientadas a comportamiento.
- Alcance mínimo: ejecuta las pruebas del módulo afectado, no suites completas si un nivel local es suficiente.
- Sigue la guía oficial: [template-docs/04-development/coding-guidelines/testing.md](file:///Users/ijgomez/Documents/workspace/template/template-docs/04-development/coding-guidelines/testing.md).
