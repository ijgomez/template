---
name: frontend-angular
description: Applies Angular frontend conventions for the dashboard module, keeping business logic out of components and aligning with the project architecture.
---

# Skill: frontend-angular

Específico del frontend Angular (módulo `dashboard`). Las reglas transversales están en `AGENTS.md` y no se repiten aquí.

## Ubicación

- `template/dashboard/src/app`: raíz de la app (config, rutas, componente raíz).
- `template/dashboard/src/app/core`: infraestructura y servicios transversales.
- `template/dashboard/src/app/shared`: componentes y utilidades reutilizables.
- `template/dashboard/src/app/features`: componentes y páginas por funcionalidad.

## Específico frontend

- Los componentes renderizan estado y delegan la lógica a servicios; nada de lógica de negocio ni cálculos ad hoc en templates.
- Las llamadas HTTP y la gestión de datos van en servicios.
- Antes de crear un componente/servicio/modelo, comprueba si ya existe uno reutilizable en `shared/`.
- Si el cambio afecta la entidad o el flujo de negocio, revisa también el backend y la API que consume.

## Verificación

Ejecuta los tests del frontend desde `template/dashboard/`:

```bash
ng test
```

## Referencia

Convenciones Angular completas: `template-docs/04-development/coding-guidelines/angular.md` (se carga vía steering `coding-angular` al editar el `dashboard`). Catálogo de componentes reutilizables: `template-docs/03-technical/frontend/components.md` (léelo bajo demanda antes de crear tabla/paginación/formulario). Módulo: `template/dashboard/README.md`.
