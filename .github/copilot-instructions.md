# Instrucciones para Copilot - Template

Este archivo es específico para GitHub Copilot. Para reglas generales del repositorio, usar [AGENTS.md](../AGENTS.md). Para la arquitectura, estilo y requisitos del proyecto, seguir la documentación técnica del repositorio y las guías de desarrollo del directorio `template-docs/`.

#[[file:template-docs/README.md]]

#[[file:template-docs/01-introduction/project-structure.md]]

## Principios del repositorio

- Mantener la separación por capas: dominio, core, web y UI.
- Priorizar soluciones simples y mantenibles sobre refactorizaciones amplias.
- No introducir dependencias cruzadas innecesarias entre módulos.
- Si se modifica comportamiento de negocio, añadir o actualizar pruebas relevantes.
- Preservar seguridad, auditoría y trazabilidad en servicios y endpoints.
- No tocar artefactos generados en `target/` ni archivos de build manualmente.
- Mantener el alcance mínimo y resolver el problema exacto en el punto de cambio.

## Documentación de referencia

Cuando el cambio afecte a Java, Angular o testing, usar la documentación técnica del proyecto como referencia principal:

- Java / Spring Boot: [template-docs/04-development/coding-guidelines/java-spring-boot.md](../template-docs/04-development/coding-guidelines/java-spring-boot.md)
- Angular / Frontend: [template-docs/04-development/coding-guidelines/angular.md](../template-docs/04-development/coding-guidelines/angular.md)
- Testing: [template-docs/04-development/coding-guidelines/testing.md](../template-docs/04-development/coding-guidelines/testing.md)
- Seguridad: [template-docs/04-development/coding-guidelines/security.md](../template-docs/04-development/coding-guidelines/security.md)
- Maven / build: [template-docs/04-development/coding-guidelines/maven.md](../template-docs/04-development/coding-guidelines/maven.md)

## Reglas de arquitectura

- La estructura del proyecto es modular: `commons`, `cluster`, `domain`, `core`, `webapp`, `ws`, `dashboard`.
- Las capas deben permanecer aisladas; no introducir lógica de negocio en la UI ni en la capa de presentación.
- En backend, seguir las convenciones Java 21 + Spring Boot 4.1.1: packages funcionales, servicios con `@Service`, repositorios con sufijo `Repository`, DTOs con nombres esperados y validaciones con Bean Validation.
- En frontend, seguir Angular 22 con TypeScript strict mode: componentes con una única responsabilidad, servicios para acceso a datos, y reutilizar componentes compartidos antes de crear nuevos.
- Si hay un flujo crítico o una regla de negocio, cubrirlo con pruebas del módulo afectado antes de cerrar el cambio.

## Reglas de testing

- Preferir pruebas unitarias en el módulo implicado y mantener la cobertura de comportamiento real.
- No ocultar errores ni suprimir validaciones sin justificación.
- Para backend: JUnit 5 + Mockito + AssertJ; para integración: Spring Boot Test + Testcontainers con PostgreSQL.
- Para Angular: componentes con `.spec.ts`, tests con Angular Testing Library y E2E con Playwright cuando el flujo lo requiera.
- Mantener los nombres de tests descriptivos y seguir el patrón given / when / then.

## Reglas de seguridad y calidad

- No loguear datos sensibles.
- Validar entradas y manejar errores en la capa apropiada.
- No añadir dependencias cruzadas ni acoplamientos innecesarios entre módulos.
- No tocar `target/`, artefactos generados ni archivos de build manualmente.

## Consulta específica

Para detalles de implementación, revisar la documentación de desarrollo en `template-docs/04-development/` y la guía de coding en `template-docs/04-development/coding-guidelines/`. En caso de duda, priorizar la documentación del propio repositorio sobre instrucciones externas o auxiliares. 
