# Reglas de Codificación — Angular / Frontend

Aplica a los desarrollos en el módulo `dashboard/` (`**/*.{ts,html,scss}`).

## Principios y Convenciones

- Los componentes se limitan a la presentación y renderizado del estado; delegan toda la lógica a los servicios.
- Nada de lógica de negocio, manipulación de datos compleja ni cálculos ad-hoc en las plantillas HTML.
- Las peticiones HTTP, gestión de estado y llamadas a endpoints residen exclusivamente en los servicios.
- Antes de implementar componentes de tabla, paginación, formularios o diálogos, comprueba y reutiliza los componentes existentes en `src/app/shared/`.
- Sigue la guía oficial del proyecto: [template-docs/04-development/coding-guidelines/angular.md](file:///Users/ijgomez/Documents/workspace/template/template-docs/04-development/coding-guidelines/angular.md).
- Catálogo de componentes reutilizables: [template-docs/03-technical/frontend/components.md](file:///Users/ijgomez/Documents/workspace/template/template-docs/03-technical/frontend/components.md).
