# Reglas de API REST

Directrices para el diseño y convenciones de la API REST.

## General

- La API REST es el contrato entre el backend (`webapp`) y el frontend (`template-dashboard`).
- Toda la API se expone bajo el prefijo `/api/v1/`.
- Los controladores viven en el módulo `webapp`, paquete `org.myorganization.template.web.<feature>`.

## Estructura de URL's

- Sustantivos en plural: `/api/v1/users`, `/api/v1/orders`.
- kebab-case para nombres compuestos: `/api/v1/order-items`.
- Sub-recursos para relaciones: `/api/v1/users/{id}/orders`.
- No incluir verbos en la URL.

## Métodos HTTP y Códigos de Respuesta

| Operación             | Método   | Código éxito     | Notas                     |
|-----------------------|----------|------------------|---------------------------|
| Obtener lista         | `GET`    | `200 OK`         | Soportar paginación       |
| Obtener uno           | `GET`    | `200 OK`         | `404` si no existe        |
| Crear                 | `POST`   | `201 Created`    | Incluir `Location` header |
| Actualización total   | `PUT`    | `200 OK`         |                           |
| Actualización parcial | `PATCH`  | `200 OK`         |                           |
| Eliminar              | `DELETE` | `204 No Content` |                           |

## Controladores

Patrón interfaz + implementación:
- Interfaz `<Recurso>Controller`: contrato HTTP, anotaciones de mapeo y OpenAPI.
- Implementación `<Recurso>ControllerImpl`: `@RestController`, `@PreAuthorize`, delegación al servicio.

## DTOs

- Nunca exponer entidades JPA directamente.
- `<Entidad>DTO` para respuestas, `Create<Entidad>Request` para creación, `Update<Entidad>Request` para actualización.
- Preferir Java Records para DTOs inmutables.

## Paginación

- Parámetros: `page` (0-indexed), `size`, `sort`.
- Respuesta con metadatos: `content`, `page`, `size`, `totalElements`, `totalPages`.

## Gestión de Errores

- `@RestControllerAdvice` centralizado.
- Formato consistente: `timestamp`, `status`, `error`, `message`, `path`.

## Endpoints de Referencia (`/references`)

- Cuando un listado necesita poblar un filtro (dropdown, selector) con datos de otra entidad, **no reutilizar el endpoint paginado de esa entidad** (requiere permisos propios). En su lugar, exponer un endpoint dedicado `GET /<recurso>/references` que devuelve pares ligeros (id + nombre).
- El endpoint `/references`:
  - Devuelve un `List<EntidadRefDTO>` (no paginado).
  - Ordenado por un campo natural (normalmente `name`).
  - Usa un DTO record mínimo: `record EntidadRefDTO(Long id, String name)`.
  - Se autoriza con los permisos del listado consumidor, **no** con los de la entidad que expone. Ejemplo: `GET /profiles/references` se autoriza con `USER_READ` porque lo consume la vista de usuarios.
- Ubicar la ruta `/references` **antes** de las rutas genéricas `/{id}` en el controlador para evitar conflictos de path matching en Spring MVC.
- En `SecurityConfig`, la regla del endpoint `/references` debe declararse **antes** del patrón genérico de la entidad.

## Documentación

- OpenAPI 3 / Springdoc (`springdoc-openapi`).
- Anotar con `@Operation`, `@ApiResponse`, `@Schema`.
