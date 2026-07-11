# Reglas de Codificación — Java / Spring Boot

## General

- Versión mínima: **Java 21**. Usar las características modernas del lenguaje: records, sealed classes, pattern matching, text blocks.
- Framework: **Spring Boot 4.1.0**.
- Todo el código debe estar en inglés (nombres de clases, métodos, variables y comentarios técnicos).

## Nomenclatura

| Elemento                  | Convención            | Ejemplo                            |
|---------------------------|-----------------------|------------------------------------|
| Clases                    | PascalCase            | `UserService`, `OrderRepository`   |
| Métodos y variables       | camelCase             | `findById`, `userEmail`            |
| Constantes                | UPPER_SNAKE_CASE      | `MAX_RETRY_COUNT`                  |
| Paquetes                  | lowercase sin guiones | `org.myorganization.template.user` |
| Ficheros de configuración | kebab-case            | `application-dev.yml`              |

## Estructura de Paquetes

- **Paquete raíz:** `org.myorganization.template`

Organizar por funcionalidad (feature package), no por capa. Cada módulo Maven tiene su propio subpaquete raíz:

| Módulo Maven | Paquete base                          |
|--------------|---------------------------------------|
| `commons`    | `org.myorganization.template.commons` |
| `cluster`    | `org.myorganization.template.cluster` |
| `domain`     | `org.myorganization.template.domain`  |
| `core`       | `org.myorganization.template.core`    |
| `webapp`     | `org.myorganization.template.web`     |

Dentro de cada módulo, organizar por feature:

```
org.myorganization.template.core
├── user/
│   ├── UserService.java
│   ├── UserRepository.java
│   └── ...
├── order/
│   └── ...
└── shared/
    └── ...
```

## Capas y Responsabilidades

- **Controller:** solo gestión de la petición HTTP y delegación al servicio. Sin lógica de negocio. Ver `coding-api.md` para las reglas detalladas de la API REST.
- **Service:** lógica de negocio. Anotado con `@Service`.
- **Repository:** acceso a datos mediante Spring Data JPA. Anotado con `@Repository`.
- **Entity:** mapeo JPA. Usar `@Entity`, evitar lógica en las entidades.
- **DTO:** objetos de transferencia de datos para entrada/salida de la API. No exponer entidades directamente.

### Responsabilidades por módulo

| Módulo    | Capa            | Contiene                                                                                |
|-----------|-----------------|-----------------------------------------------------------------------------------------|
| `core`    | Servicio        | Servicios de negocio, DAOs, workers planificados, gestión transaccional                 |
| `domain`  | Dominio         | Entidades JPA, DTOs, enums de dominio, plantillas Velocity                              |
| `commons` | Transversal     | Clases de utilidad compartidas entre módulos (mantener al mínimo)                       |
| `cluster` | Infraestructura | Coordinación del cluster, heartbeat de nodos, distribución de tareas                    |
| `webapp`  | Presentación    | Endpoints REST/SOAP, controladores, config Spring Security, clase principal Spring Boot |

## API REST

Las reglas detalladas de diseño y convenciones de la API REST están en `coding-api.md`.

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
