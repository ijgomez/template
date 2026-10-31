# Reglas de Codificación — Java / Spring Boot

Directrices de codificación para el backend Java 21 con Spring Boot 4.1.1.

## General

- Versión mínima: **Java 21**. Usar las características modernas del lenguaje: records, sealed classes, pattern matching, text blocks.
- Framework: **Spring Boot 4.1.1**.
- Todo el código debe estar en inglés (nombres de clases, métodos, variables y comentarios técnicos).
- Usar **Lombok** para reducir código repetitivo (getters, setters, constructores, builders, etc.).

### Lombok en entidades JPA

- En clases `@Entity` usar únicamente `@Getter`/`@Setter` para eliminar el boilerplate de acceso.
- No usar `@Data`, `@EqualsAndHashCode` ni `@ToString` sobre entidades con asociaciones LAZY: pueden provocar `LazyInitializationException`, recursión entre entidades y problemas de identidad JPA.
- En claves compuestas (`@Embeddable`) sí se permite `@Getter`/`@Setter`/`@EqualsAndHashCode`, ya que todos sus campos forman la clave.
- Mantener siempre el constructor sin argumentos que exige JPA y los callbacks `@PrePersist`/`@PreUpdate`.

## Logging

- Usar **SLF4J** como API de logging en el código y declarar el logger con Lombok mediante `@Slf4j`. El backend queda desacoplado: cambiar de Logback a Log4j2 (o viceversa) solo requiere ajustar dependencias y configuración, no el código.
- **Log4j2** es el backend recomendado: excluir `spring-boot-starter-logging` (Logback) y añadir `spring-boot-starter-log4j2` cuando se quiera usar ese backend.
- Ejemplo de declaración del logger:

```java
@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    public UserDTO findById(Long id) {
        log.debug("Finding user by id: {}", id);
        // ...
    }
}
```

- `@RequiredArgsConstructor` genera el constructor de inyección para los campos `final`; con un único constructor Spring no necesita `@Autowired`. Los campos anotados con `@Value` conservan la anotación en el parámetro del constructor gracias a `lombok.config` (`lombok.copyableAnnotations`).
- Si el servicio extiende una clase base que requiere argumentos en `super(...)`, mantener el constructor explícito: Lombok no puede generar la llamada al constructor del padre.
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

- Inyección de dependencias siempre por constructor con `@RequiredArgsConstructor` (sin `@Autowired` cuando solo hay un constructor).
- Usar `Optional<T>` en lugar de retornar `null`.
- Validar entradas con Bean Validation (`@Valid`, `@NotNull`, `@Size`, etc.).
- No capturar excepciones genéricas salvo en el manejador global.
- Externalizar toda configuración en `application.yml`.
- Escribir tests unitarios con JUnit 5 y Mockito. Tests de integración con `@SpringBootTest`.

## Testing

- **JUnit 5**, **Mockito**, **Spring Boot Test**, **Testcontainers**, **MockMvc**, **Instancio**, **ArchUnit 1.5.0**, **JaCoCo**, **SonarQube**.
- Tests unitarios: `<Clase>Test.java` con patrón given/when/then.
- Tests de integración: `<Clase>IT.java` con Testcontainers + PostgreSQL.
- Tests de arquitectura: `<Aspecto>ArchitectureTest.java` con **ArchUnit 1.5.0** para validar dependencias entre capas y convenciones de nombres.
- Usar AssertJ para aserciones.
