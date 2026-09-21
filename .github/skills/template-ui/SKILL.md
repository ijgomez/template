---
name: template-ui
description: Applies Angular frontend conventions for the dashboard module, keeping business logic out of components and aligning with the project architecture.
---

# Skill: template-ui

Aplica esta skill cuando trabajes en la capa frontend del proyecto, especialmente en el módulo `dashboard` y sus componentes, servicios, modelos y páginas.

## Principios del frontend

- Mantener la separación entre presentación, lógica de negocio y servicios.
- No poner lógica de negocio en componentes si puede encapsularse en servicios o casos de uso.
- Preferir patrones simples y mantenibles sobre arquitecturas complejas.
- Reusar servicios y modelos existentes antes de crear nuevas abstracciones.
- Mantener la UI orientada a eventos y a la renderización de estado, no a cálculos ad hoc en templates.

## Ubicación recomendada

- `dashboard/src/app`: componentes, servicios, modelos, módulos y páginas.
- `dashboard/src/app/core`: infraestructura y servicios transversales.
- `dashboard/src/app/shared`: componentes y utilidades reutilizables.
- Evitar duplicar lógica de dominio en componentes o templates.

## Reglas clave

- Los componentes deben centrarse en renderizar estado y delegar lógica a servicios.
- Las llamadas HTTP y la gestión de datos deben ir a servicios.
- Los pipes, directivas y helpers deben mantenerse pequeños y reutilizables.
- Si el cambio afecta la entidad o el flujo de negocio, revisa también la capa de backend y la API que consume.
- Antes de crear una nueva abstracción, comprueba si ya existe una vía reutilizable.

## Estructura y estilo

- Mantén nombres claros y consistentes para componentes, servicios y modelos.
- Evita lógica muy acoplada a la vista; si aumenta el tamaño del componente, mueve el cálculo o la preparación de datos a un servicio o utilidad.
- Prioriza la legibilidad sobre soluciones demasiado “elegantes”.
- Si cambias un flujo de usuario o una validación visual, añade o actualiza las pruebas del módulo implicado.

## Validación mínima del frontend

- Ejecuta la prueba más cercana al cambio: componente, servicio o flujo relevante.
- Si el cambio afecta routing, formularios o integración con la API, valida ese flujo real en el módulo afectado.
- No vuelvas a ejecutar la suite completa si no es necesario.

## Checklist antes de terminar

- El componente no contiene lógica de negocio que debería ir en servicio o capa de dominio.
- Los cambios son coherentes con la estructura Angular del proyecto.
- No se han añadido utilidades innecesarias ni duplicados.
- Se han revisado los flujos de datos con la API o servicios relacionados.
- Hay pruebas relevantes del módulo modificado o se ha documentado por qué no aplica.

## Referencias del repositorio

- [AGENTS.md](../../../AGENTS.md)
- [.github/copilot-instructions.md](../../copilot-instructions.md)
- [template-docs/README.md](../../../template-docs/README.md)
- [template-docs/04-development/coding-guidelines.md](../../../template-docs/04-development/coding-guidelines.md)
- [template/dashboard/README.md](../../../template/dashboard/README.md)
