# Reglas de Codificación — Angular / Frontend

## General

- Versión: **Angular 22**.
- Framework de estilos: **Bootstrap 5.3.8**.
- Todo el código debe estar en inglés (nombres de clases, métodos, variables y comentarios técnicos).
- Usar **TypeScript strict mode** activado.

## Nomenclatura

| Elemento | Convención | Ejemplo |
|---|---|---|
| Componentes | PascalCase + sufijo | `UserListComponent` |
| Servicios | PascalCase + sufijo | `AuthService` |
| Ficheros | kebab-case + tipo | `user-list.component.ts` |
| Variables y métodos | camelCase | `getUserById`, `isLoading` |
| Constantes | UPPER_SNAKE_CASE | `API_BASE_URL` |
| Interfaces | PascalCase con prefijo `I` opcional | `User`, `IUserResponse` |

## Estructura de Carpetas

Organizar por funcionalidad (feature modules):

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

- Preferir **componentes standalone** (Angular 22).
- Mantener los componentes pequeños y con una única responsabilidad.
- Separar siempre template (`.html`), estilos (`.scss`) y lógica (`.ts`).
- Usar `OnPush` como estrategia de detección de cambios cuando sea posible.
- Desuscribirse de observables en `ngOnDestroy` o usar `takeUntilDestroyed()`.

## Servicios

- Los servicios de acceso a la API deben vivir en `core/` o en la carpeta `services/` de su feature.
- Usar `HttpClient` para las llamadas HTTP. Nunca hacer llamadas HTTP desde un componente directamente.
- Gestionar errores HTTP con `catchError` en el servicio.

## Estilos con Bootstrap

- Usar las clases utilitarias de Bootstrap 5 en lugar de estilos inline.
- Los estilos específicos de componente van en el fichero `.scss` del componente.
- Usar variables SCSS de Bootstrap para personalizar colores y tamaños, no sobreescribir clases directamente.
- Evitar `!important`.

## Buenas Prácticas

- Tipar siempre: no usar `any` salvo justificación excepcional.
- Usar modelos/interfaces para los datos de la API (carpeta `models/`).
- Gestionar el estado de carga y error en los componentes que consumen observables.
- Usar `environment.ts` para las URLs de la API y otras configuraciones por entorno.
- Lazy loading para los feature modules.
- Escribir tests unitarios con **Jasmine/Karma** o **Jest**.
