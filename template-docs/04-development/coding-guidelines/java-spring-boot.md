# Reglas de Codificación — Java / Spring Boot

Directrices de codificación para el backend Java 21 con Spring Boot 4.1.0.

## General

- Versión mínima: **Java 21**. Usar las características modernas del lenguaje: records, sealed classes, pattern matching, text blocks.
- Framework: **Spring Boot 4.1.0**.
- Todo el código debe estar en inglés (nombres de clases, métodos, variables y comentarios técnicos).
- Usar **Lombok** para reducir código repetitivo (getters, setters, constructores, builders, etc.).

## Logging

- Usar **Log4j2** como framework de logging. Excluir `spring-boot-starter-logging` (Logback) y añadir `spring-boot-starter-log4j2`.
- Declarar el logger con Lombok usando `@Log4j2` en lugar de instanciarlo manualmente:

```java
@Log4j2
@Service
@RequiredArgsConstructor(onConstructor = @__(@Autowired))
public class UserService {

    public UserDTO findById(Long id) {
        log.debug("Finding user by id: {}", id);
        // ...
    }
}
```

- Configurar Log4j2 mediante `log4j2.xml` (o `log4j2-spring.xml` para integración con perfiles de Spring) en `src/main/resources`.
- Niveles por entorno: `DEBUG` en desarrollo, `INFO` en preproducción, `WARN`/`ERROR` en producción.
- No loguear datos sensibles (contraseñas, tokens, datos personales).
- Usar siempre placeholders `{}` para el formateo de mensajes; nunca concatenar strings en el log.

## Modos de Despliegue

La aplicación soporta dos modos de empaquetado y despliegue:

### Microservicio (JAR ejecutable)

- Empaquetado como JAR con servidor embebido (Tomcat embebido de Spring Boot).
- Arranca de forma autónoma con `java -jar app.jar`.
- El módulo `webapp` usa `packaging: jar`.

### Aplicación Web (WAR desplegable)

- Empaquetado como WAR para desplegar en un servidor de aplicaciones externo.
- Servidores soportados: **Apache Tomcat** y **WildFly**.
- La clase principal extiende `SpringBootServletInitializer`:

```java
@SpringBootApplication
public class Application extends SpringBootServletInitializer {

    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder builder) {
        return builder.sources(Application.class);
    }

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

- El módulo `webapp` usa `packaging: war`.
- Excluir el servidor embebido en el WAR añadiendo `spring-boot-starter-tomcat` con scope `provided`.
- Usar perfiles Maven (`-P jar` / `-P war`) o perfiles de Spring para diferenciar la configuración entre modos.

## Nomenclatura

| Elemento                  | Convención            | Ejemplo                            |
|---------------------------|-----------------------|------------------------------------|
| Clases                    | PascalCase            | `UserService`, `OrderRepository`   |
| Métodos y variables       | camelCase             | `findById`, `userEmail`            |
| Constantes                | UPPER_SNAKE_CASE      | `MAX_RETRY_COUNT`                  |
| Paquetes                  | lowercase sin guiones | `org.myorganization.template.user` |
| Ficheros de configuración | kebab-case            | `application-dev.yml`              |

### Sufijos obligatorios por estereotipo

| Anotación                          | Sufijo obligatorio | Ejemplo              |
|------------------------------------|--------------------|----------------------|
| `@Service`                         | `Service`          | `UserService`        |
| `@Repository`                      | `Repository`       | `UserRepository`     |
| `@RestController` (implementación) | `ControllerImpl`   | `UserControllerImpl` |
| Interfaz de controlador            | `Controller`       | `UserController`     |
| `@Component`                       | Descriptivo libre  | `JwtTokenParser`     |

### Nomenclatura de DTOs

| Tipo              | Patrón                   | Ejemplo             |
|-------------------|--------------------------|---------------------|
| DTO respuesta     | `<Entidad>DTO`           | `UserDTO`           |
| DTO creación      | `Create<Entidad>Request` | `CreateUserRequest` |
| DTO actualización | `Update<Entidad>Request` | `UpdateUserRequest` |

## Estructura de Paquetes

- **Paquete raíz:** `org.myorganization.template`

| Módulo Maven | Paquete base                          |
|--------------|---------------------------------------|
| `commons`    | `org.myorganization.template.commons` |
| `cluster`    | `org.myorganization.template.cluster` |
| `domain`     | `org.myorganization.template.domain`  |
| `core`       | `org.myorganization.template.core`    |
| `webapp`     | `org.myorganization.template.web`     |

Organizar por funcionalidad (feature package), no por capa.

## Capas y Responsabilidades

| Módulo    | Capa            | Contiene                                                                                |
|-----------|-----------------|-----------------------------------------------------------------------------------------|
| `core`    | Servicio        | Servicios de negocio, DAOs, workers planificados, gestión transaccional                 |
| `domain`  | Dominio         | Entidades JPA, DTOs, enums de dominio, plantillas Velocity                              |
| `commons` | Transversal     | Clases de utilidad compartidas entre módulos (mantener al mínimo)                       |
| `cluster` | Infraestructura | Coordinación del cluster, heartbeat de nodos, distribución de tareas                    |
| `webapp`  | Presentación    | Endpoints REST/SOAP, controladores, config Spring Security, clase principal Spring Boot |

## Búsqueda Paginada por Criterios en Repositorios

Todo `@Repository` asociado a una entidad debe exponer `findByCriteria` y `countByCriteria`. Usar JPA Criteria API con el Static Metamodel (`hibernate-jpamodelgen`) para consultas type-safe.

| Elemento        | Patrón               | Ejemplo          |
|-----------------|----------------------|------------------|
| Objeto Criteria | `<Entidad>Criteria`  | `UserCriteria`   |
| Método búsqueda | `findByCriteria`     | —                |
| Método conteo   | `countByCriteria`    | —                |

## Buenas Prácticas

- Inyección de dependencias siempre por constructor con `@RequiredArgsConstructor(onConstructor = @__(@Autowired))`.
- Usar `Optional<T>` en lugar de retornar `null`.
- Validar entradas con Bean Validation (`@Valid`, `@NotNull`, `@Size`, etc.).
- No capturar excepciones genéricas salvo en el manejador global.
- Externalizar toda configuración en `application.yml`.
- Escribir tests unitarios con JUnit 5 y Mockito. Tests de integración con `@SpringBootTest`.

## Testing

- **JUnit 5**, **Mockito**, **Spring Boot Test**, **Testcontainers**, **MockMvc**, **Instancio**, **JaCoCo**, **SonarQube**.
- Tests unitarios: `<Clase>Test.java` con patrón given/when/then.
- Tests de integración: `<Clase>IT.java` con Testcontainers + PostgreSQL.
- Usar AssertJ para aserciones.
