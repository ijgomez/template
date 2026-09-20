# AGENTS.md

## Propósito
Este repositorio usa una arquitectura modular con Java 21, Spring Boot 4.1.1 y Angular. Las reglas de este fichero aplican a cualquier agente o asistente que opere sobre el proyecto.

## Estructura principal
- `template/`: proyecto padre y agregador Maven.
- `commons/`: utilidades transversales.
- `cluster/`: alta disponibilidad y coordinación.
- `domain/`: modelo y persistencia.
- `core/`: lógica de negocio.
- `ws/`: API backend.
- `webapp/`: capa web/integración.
- `dashboard/`: frontend Angular.

## Reglas obligatorias
- Mantener la separación por capas: dominio, core, web y UI.
- Priorizar simplicidad y mantenibilidad sobre refactorizaciones amplias.
- No introducir dependencias cruzadas innecesarias entre módulos.
- Si cambias comportamiento de negocio, añade o actualiza pruebas relevantes.
- Preservar seguridad, auditoría y trazabilidad en servicios y endpoints.
- No tocar artefactos generados en `target/` ni archivos de build manualmente.

## Documentación de referencia
- [template-docs/README.md](template-docs/README.md)
- [template-docs/01-introduction/project-structure.md](template-docs/01-introduction/project-structure.md)
- [template-docs/04-development/coding-guidelines.md](template-docs/04-development/coding-guidelines.md)
- [template-docs/04-development/build.md](template-docs/04-development/build.md)

## Trabajo del agente
- Buscar primero el punto exacto del cambio y mantener el alcance mínimo.
- Para backend, seguir la guía Java / Spring Boot del proyecto.
- Para frontend, seguir la guía Angular y la documentación del frontend.
- Ejecutar la validación mínima necesaria para el área afectada.
- Preferir pruebas automáticas en el módulo implicado antes de dar por resuelto un cambio.

## No hacer
- No introducir dependencias cruzadas o acoplamientos innecesarios entre módulos.
- No reescribir módulos completos si el cambio puede resolverse en un punto concreto.
- No tocar `target/`, artefactos generados ni ficheros de build manualmente.
- No ocultar errores ni suprimir validaciones sin justificación.
- No añadir lógica de negocio en capas equivocadas.

## Antes de terminar
- Revisar que el cambio respeta la separación por capas.
- Comprobar que la solución sigue las guías del proyecto y no rompe la arquitectura.
- Validar con pruebas relevantes del módulo afectado.
- Confirmar que no se han dejado cambios innecesarios o artefactos generados.

## Herramientas específicas
- [.github/copilot-instructions.md](.github/copilot-instructions.md): reglas específicas de Copilot.
- [.kiro/steering](.kiro/steering): guía de arquitectura y estilo para Kiro.
