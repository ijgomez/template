# Reglas de API REST

Directrices para el diseño y convenciones de la API REST.

## General

- La API REST es el contrato entre el backend (`webapp`) y el frontend (`dashboard`).
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
- Las reglas de autorización de estos endpoints en `SecurityConfig` se detallan en [security.md](security.md), sección "Autorización de Endpoints Auxiliares para Filtros".

## Fechas y Zonas Horarias

**Regla:** el usuario ve siempre las fechas en la zona horaria de su navegador; el backend y la base de datos manejan siempre las fechas en **UTC**. La conversión entre ambas se hace únicamente en el frontend.

| Capa           | Regla                                                                                                     |
|----------------|-----------------------------------------------------------------------------------------------------------|
| Base de datos  | Columnas de instante con tipo `TIMESTAMP WITH TIME ZONE`; el servidor PostgreSQL trabaja en UTC.          |
| Backend (Java) | Tipo `OffsetDateTime` en UTC (`OffsetDateTime.now(ZoneOffset.UTC)`); `hibernate.jdbc.time_zone` y `spring.jackson.time-zone` a `UTC`. No usar `ZoneId.systemDefault()` ni `LocalDateTime` para instantes. |
| API REST       | Los instantes viajan en ISO-8601 con offset, en UTC (`2026-10-24T22:00:00.000Z`), tanto en respuestas como en parámetros. Los parámetros se declaran con `@DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)`. |
| Frontend       | Se muestran con `LocalDatePipe` / `DateService`, que convierten a la zona del navegador. No mostrar nunca el valor UTC en bruto. |

### Filtros por rango de fechas

- El usuario elige días locales (`<input type="date">` → `YYYY-MM-DD`). El frontend los convierte en el **rango semiabierto UTC** `[fromDate, toDate)` con `DateService.toUtcStartOfLocalDay` (00:00 local del día inicial) y `DateService.toUtcStartOfNextLocalDay` (00:00 local del día siguiente al final).
- En el backend `fromDate` es **inclusivo** (`>=`) y `toDate` **exclusivo** (`<`).
- No calcular límites sumando 24 h en UTC: los días de cambio de hora duran 23 o 25 horas.
- No enviar fechas sin zona (`2026-10-25`) al backend: son ambiguas y se rechazan con `400`.

### Excepciones

Los datos de calendario civil que no son instantes (fecha de nacimiento, festivos, "todos los días a las 09:00 de Madrid") se modelan con `LocalDate` / `LocalTime` y, si aplica, la zona horaria (`ZoneId`) explícita; no se convierten a UTC.

## Documentación

- OpenAPI 3 / Springdoc (`springdoc-openapi`).
- Anotar con `@Operation`, `@ApiResponse`, `@Schema`.
