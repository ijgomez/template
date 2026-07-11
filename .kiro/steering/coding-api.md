# Reglas de API REST

## General

- La API REST es el contrato entre el backend (`webapp`) y el frontend (`template-dashboard`) u otros clientes.
- Toda la API se expone bajo el prefijo `/api/v1/` para permitir versionado sin romper clientes existentes.
- Los controladores viven en el módulo `webapp`, en el paquete `org.myorganization.template.web.<feature>`.

## Estructura de URLs

- Usar sustantivos en plural para los recursos: `/api/v1/users`, `/api/v1/orders`.
- Usar kebab-case para nombres compuestos: `/api/v1/order-items`.
- Representar relaciones con sub-recursos cuando tenga sentido: `/api/v1/users/{id}/orders`.
- No incluir verbos en la URL; la acción la indica el método HTTP.

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

- Usar `@RestController` con `@RequestMapping("/api/v1/<recurso>")` a nivel de clase.
- Responder siempre con `ResponseEntity<T>` para tener control explícito del código HTTP.
- Sin lógica de negocio en el controlador; delegar todo al servicio correspondiente.
- Validar la entrada con `@Valid` y Bean Validation (`@NotNull`, `@Size`, etc.).

```java
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.findById(id));
    }

    @PostMapping
    public ResponseEntity<UserDto> create(@Valid @RequestBody CreateUserRequest request) {
        UserDto created = userService.create(request);
        URI location = URI.create("/api/v1/users/" + created.id());
        return ResponseEntity.created(location).body(created);
    }
}
```

## DTOs

- Nunca exponer entidades JPA directamente en la API; usar siempre DTOs.
- Los DTOs de respuesta viven en `domain` (paquete `org.myorganization.template.domain.<feature>`).
- Los DTOs de petición (request bodies) pueden vivir en `webapp` o `domain` según reutilización.
- Preferir **Java Records** para DTOs inmutables:

```java
public record UserDto(Long id, String email, String name) {}
public record CreateUserRequest(@NotBlank String email, @NotBlank String name) {}
```

## Paginación

- Usar `Pageable` de Spring Data para endpoints de listado.
- Parámetros estándar: `page` (0-indexed), `size`, `sort`.
- Envolver la respuesta paginada en un objeto con metadatos:

```json
{
  "content": [...],
  "page": 0,
  "size": 20,
  "totalElements": 150,
  "totalPages": 8
}
```

## Gestión de Errores

- Centralizar el manejo de errores con `@RestControllerAdvice`.
- Usar un formato de error consistente en todas las respuestas de error:

```json
{
  "timestamp": "2024-01-01T12:00:00Z",
  "status": 404,
  "error": "Not Found",
  "message": "Usuario con id 42 no encontrado",
  "path": "/api/v1/users/42"
}
```

- Mapear excepciones de negocio a códigos HTTP en el `@RestControllerAdvice`, no en los controladores.

## Seguridad

Las reglas detalladas de seguridad (autenticación JWT, autorización, CORS, protección contra vulnerabilidades) están en `coding-security.md`.

## Documentación

- Documentar la API con **OpenAPI 3 / Springdoc** (`springdoc-openapi`).
- Anotar controladores y DTOs con `@Operation`, `@ApiResponse` y `@Schema` cuando la descripción no sea obvia.
- El contrato OpenAPI generado (`/v3/api-docs`) es la fuente de verdad para el frontend.

## Comunicación Frontend ↔ Backend

- El frontend (`template-dashboard`) consume la API usando el `HttpClient` de Angular.
- Los modelos TypeScript del frontend deben mantenerse sincronizados con los DTOs del backend.
- Usar el fichero de entorno Angular (`environment.ts`) para configurar la URL base de la API.
