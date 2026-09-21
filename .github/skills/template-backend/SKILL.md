---
name: template-backend
description: Applies Java and Spring Boot conventions for the backend modules while preserving the repo’s layered architecture and business rules.
---

# Skill: template-backend

Aplica esta skill cuando trabajes en cualquiera de los módulos backend del repositorio: `commons`, `cluster`, `domain`, `core`, `webapp` o `ws`.

## Principios base

- Mantener la separación por capas: dominio, core, web y UI.
- Priorizar soluciones simples, legibles y mantenibles.
- No introducir acoplamientos innecesarios entre módulos.
- No introducir lógica de negocio en capas equivocadas.
- Preservar seguridad, auditoría y trazabilidad en servicios y endpoints.
- No tocar artefactos generados ni ficheros de build manualmente, especialmente `target/`.

## Regla de ubicación por capa

- `domain`: entidades, persistencia, mapeos y reglas de dominio.
- `core`: lógica de negocio y casos de uso.
- `webapp` / `ws`: controllers, API, validación HTTP y adaptadores de entrada/salida.
- `commons`: utilidades transversales, solo si no introducen dependencias de negocio o de dominio.
- `cluster`: coordinación y servicios infraestructurales.

Antes de implementar cambios, identifica la capa responsable y resuelve el problema en la ubicación correcta. Evita “meter todo en el controller” o duplicar lógica de negocio en varios módulos.

## Estilo y buenas prácticas Java/Spring

- Usa nombres claros, consistentes y específicos para clases, servicios y métodos.
- Mantén el servicio o caso de uso responsable de la lógica de negocio y no la mezcles con detalles HTTP.
- Reutiliza validaciones y utilidades existentes antes de crear nuevas abstracciones.
- Si un cambio afecta contratos o modelos de datos, revisa los consumidores implicados.
- No ocultes errores ni silencies de validación sin justificación técnica.

## Cambios de negocio y pruebas

Si el cambio afecta comportamiento de negocio:

- agrega o actualiza las pruebas relevantes del módulo involucrado
- valida el comportamiento mínimo que cubre el cambio
- evita cambios globales si el problema puede resolverse localmente
- comprueba si el cambio afecta serialización, validación, endpoints o persistencia

## Validación mínima requerida

- Ejecuta la prueba más cercana al ámbito del cambio.
- Para cambios en APIs o integración, valida el flujo real afectado en ese módulo.
- Evita lanzar suites completas si no son necesarias.

## Checklist antes de terminar

- El cambio está en la capa correcta.
- No se ha introducido acoplamiento cruzado innecesario.
- La solución sigue el estilo del repositorio y de Spring Boot.
- Se han añadido o actualizado pruebas relevantes.
- No se han tocado artefactos de build generados ni archivos manuales.
- La validación mínima del área afectada ha sido ejecutada.

## Referencias del repositorio

- [AGENTS.md](../../../AGENTS.md)
- [.github/copilot-instructions.md](../../copilot-instructions.md)
- [template-docs/README.md](../../../template-docs/README.md)
- [template-docs/04-development/coding-guidelines.md](../../../template-docs/04-development/coding-guidelines.md)
- [template-docs/04-development/build.md](../../../template-docs/04-development/build.md)
