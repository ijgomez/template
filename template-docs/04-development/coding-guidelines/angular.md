# Reglas de Codificación — Angular / Frontend

Directrices de codificación para el frontend con Angular 22 y Bootstrap 5.3.8.

## General

- Versión: **Angular 22**.
- Framework de estilos: **Bootstrap 5.3.8**.
- Todo el código en inglés.
- **TypeScript strict mode** activado.

## Nomenclatura

| Elemento            | Convención                          | Ejemplo                    |
|---------------------|-------------------------------------|----------------------------|
| Componentes         | PascalCase + sufijo                 | `UserListComponent`        |
| Servicios           | PascalCase + sufijo                 | `AuthService`              |
| Ficheros            | kebab-case + tipo                   | `user-list.component.ts`   |
| Variables y métodos | camelCase                           | `getUserById`, `isLoading` |
| Constantes          | UPPER_SNAKE_CASE                    | `API_BASE_URL`             |
| Interfaces          | PascalCase con prefijo `I` opcional | `User`, `IUserResponse`    |

## Estructura de Carpetas

```
src/
└── app/
    ├── core/               # Servicios singleton, guards, interceptors
    ├── shared/             # Componentes, pipes y directivas reutilizables
    ├── features/
    │   ├── user/
    │   │   ├── components/
    │   │   ├── services/
    │   │   ├── models/
    │   │   └── user.module.ts
    │   └── ...
    └── app.module.ts
```

## Componentes

- Preferir componentes standalone (Angular 22).
- Separar template (`.html`), estilos (`.scss`) y lógica (`.ts`).
- Usar `OnPush` como estrategia de detección de cambios cuando sea posible.

## Servicios

- Usar `HttpClient` para llamadas HTTP.
- Gestionar errores HTTP con `catchError`.
- Nunca hacer llamadas HTTP desde un componente directamente.

## Estilos con Bootstrap

- Clases utilitarias de Bootstrap 5 en lugar de estilos inline.
- Variables SCSS de Bootstrap para personalización.
- Evitar `!important`.

## Configuración y Propiedades

Convención: `<nombreAplicacion>.<funcionalidad>.<propiedad>` en `environment.ts`.

## Testing

- **Jest** como framework principal.
- **Angular Testing Library** para tests de componentes.
- **HttpClientTestingModule** para mockear HTTP.
- Nomenclatura: `<nombre>.spec.ts`.
- Patrón arrange / act / assert.
- Usar `data-testid` para seleccionar elementos.
