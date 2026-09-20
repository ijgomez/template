# Instrucciones para Copilot - Template

Este archivo es específico para GitHub Copilot. Para reglas generales del repositorio, usar [AGENTS.md](../AGENTS.md). Para arquitectura y estilo de Kiro, usar [.kiro/steering](../.kiro/steering).

#[[file:template-docs/README.md]]

#[[file:template-docs/01-introduction/project-structure.md]]

## Principios del repositorio

- Mantener la separación por capas: dominio, core, web y UI.
- Priorizar soluciones simples y mantenibles sobre refactorizaciones amplias.
- No introducir dependencias cruzadas innecesarias entre módulos.
- Si se modifica comportamiento de negocio, añadir o actualizar pruebas relevantes.
- Preservar seguridad, auditoría y trazabilidad en servicios y endpoints.
- No tocar artefactos generados en `target/` ni archivos de build manualmente.

## Consulta específica

Para detalles de implementación, revisar la documentación de desarrollo en `template-docs/04-development/` y la guía de coding en `template-docs/04-development/coding-guidelines/`.
