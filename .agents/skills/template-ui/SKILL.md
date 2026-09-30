---
name: template-ui
description: Applies Angular frontend conventions for the dashboard module, keeping business logic out of components and aligning with project architecture.
---

# Skill: template-ui

Específico del frontend Angular (módulo `dashboard`). Las reglas transversales están en `AGENTS.md` y no se repiten aquí.

## Ubicación

- `dashboard/src/app`: componentes, servicios, modelos, módulos y páginas.
- `dashboard/src/app/core`: infraestructura y servicios transversales.
- `dashboard/src/app/shared`: componentes y utilidades reutilizables.

## Específico frontend

- Los componentes renderizan estado y delegan la lógica a servicios; nada de lógica de negocio ni cálculos ad hoc en templates.
- Las llamadas HTTP y la gestión de datos van en servicios.
- Antes de crear un componente/servicio/modelo, comprueba si ya existe uno reutilizable en `shared/`.
- Si el cambio afecta la entidad o el flujo de negocio, revisa también el backend y la API que consume.

## Referencias

- Guía de convenciones Angular: `template-docs/04-development/coding-guidelines/angular.md`
- Catálogo de componentes reutilizables: `template-docs/03-technical/frontend/components.md` (léelo bajo demanda antes de crear tabla/paginación/formulario).
- Documentación del módulo: `template/dashboard/README.md`
