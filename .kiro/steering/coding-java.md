# Reglas de Codificación — Java / Spring Boot

## General

- Versión mínima: **Java 21**. Usar las características modernas del lenguaje: records, sealed classes, pattern matching, text blocks.
- Framework: **Spring Boot 4.1.0**.
- Todo el código debe estar en inglés (nombres de clases, métodos, variables y comentarios técnicos).

## Nomenclatura

| Elemento | Convención | Ejemplo |
|---|---|---|
| Clases | PascalCase | `UserService`, `OrderRepository` |
| Métodos y variables | camelCase | `findById`, `userEmail` |
| Constantes | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Paquetes | lowercase sin guiones | `com.example.myapp.user` |
| Ficheros de configuración | kebab-case | `application-dev.yml` |

## Estructura de Paquetes

Organizar por funcionalidad (feature package), no por capa:

```
com.example.myapp
├── user/
│   ├── UserController.java
│   ├── UserService.java
│   ├── UserRepository.java
│   └── User.java
├── order/
│   └── ...
└── shared/
    └── ...
```

## Capas y Responsabilidades

- **Controller:** solo gestión de la petición HTTP y delegación al servicio. Sin lógica de negocio.
- **Service:** lógica de negocio. Anotado con `@Service`.
- **Repository:** acceso a datos mediante Spring Data JPA. Anotado con `@Repository`.
- **Entity:** mapeo JPA. Usar `@Entity`, evitar lógica en las entidades.
- **DTO:** objetos de transferencia de datos para entrada/salida de la API. No exponer entidades directamente.

## API REST

- Usar `@RestController` y mapeos estándar (`@GetMapping`, `@PostMapping`, etc.).
- Responder siempre con `ResponseEntity<T>`.
- Versionar la API en la URL: `/api/v1/...`.
- Usar códigos HTTP semánticamente correctos (200, 201, 204, 400, 404, 500).
- Manejar errores globalmente con `@RestControllerAdvice`.

## Base de Datos y Liquibase

- Usar **Spring Data JPA** para el acceso a datos.
- No usar `ddl-auto: create` o `update` en producción. Las migraciones las gestiona **Liquibase**.
- Los changesets de Liquibase deben ser atómicos, irreversibles salvo rollback explícito, e identificados con autor y fecha: `id: 20240101-create-user-table`.

## Buenas Prácticas

- Inyección de dependencias siempre por constructor (no `@Autowired` en campo).
- Usar `Optional<T>` en lugar de retornar `null`.
- Validar entradas con Bean Validation (`@Valid`, `@NotNull`, `@Size`, etc.).
- No capturar excepciones genéricas (`Exception`, `Throwable`) salvo en el manejador global.
- Externalizar toda configuración en `application.yml`. No hardcodear valores.
- Escribir tests unitarios con **JUnit 5** y **Mockito**. Los tests de integración con `@SpringBootTest`.
