# Reglas de API REST

Directrices para el diseño y convenciones de la API REST.

## General

- La API REST es el contrato entre el backend (`webapp`) y el frontend (`template-dashboard`).
- Toda la API se expone bajo el prefijo `/api/v1/`.
- Los controladores viven en el módulo `webapp`, paquete `org.myorganization.template.web.<feature>`.

## Estructura de URLs

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

## Documentación

- OpenAPI 3 / Springdoc (`springdoc-openapi`).
- Anotar con `@Operation`, `@ApiResponse`, `@Schema`.
