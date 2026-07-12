# Reglas de Codificación — Java / Spring Boot

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
- Excluir el servidor embebido en el WAR añadiendo `spring-boot-starter-tomcat` con scope `provided`:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-tomcat</artifactId>
    <scope>provided</scope>
</dependency>
```

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

- Toda clase anotada con `@Service` **debe** terminar en `Service`.
- Toda clase anotada con `@Repository` **debe** terminar en `Repository`.
- Los controladores siguen el patrón interfaz + implementación: la interfaz termina en `Controller` y la clase anotada con `@RestController` termina en `ControllerImpl`. Ver `coding-api.md` para el detalle del patrón.

### Nomenclatura de DTO's

- Los DTO's de respuesta deben tener el mismo nombre que la entidad correspondiente seguido del sufijo `DTO`: `<Entidad>DTO`.
- Ejemplo: entidad `User` → DTO de respuesta `UserDTO`.

| Tipo              | Patrón                   | Ejemplo             |
|-------------------|--------------------------|---------------------|
| DTO respuesta     | `<Entidad>DTO`           | `UserDTO`           |
| DTO creación      | `Create<Entidad>Request` | `CreateUserRequest` |
| DTO actualización | `Update<Entidad>Request` | `UpdateUserRequest` |

## Estructura de Paquetes

- **Paquete raíz:** `org.myorganization.template`

Organizar por funcionalidad (feature package), no por capa. Cada módulo Maven tiene su propio sub paquete raíz:

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

## Búsqueda Paginada por Criterios en Repositorios

Todo `@Repository` asociado a una entidad **debe** exponer dos métodos para búsquedas dinámicas paginadas:

| Método            | Retorno        | Descripción                                                          |
|-------------------|----------------|----------------------------------------------------------------------|
| `findByCriteria`  | `List<Entity>` | Devuelve los registros que cumplen los criterios, paginados          |
| `countByCriteria` | `long`         | Devuelve el número total de registros que cumplen los mismos criterios |

Ambos métodos comparten la misma lógica de construcción de consulta dinámica; la única diferencia es que `countByCriteria` ejecuta un `SELECT COUNT(...)` en lugar de un `SELECT *`.

### Objeto Criteria

- Para cada entidad existe un objeto de criterios con el nombre `<Entidad>Criteria` (p. ej. entidad `User` → `UserCriteria`).
- El objeto Criteria vive en el módulo `domain`, junto a la entidad correspondiente.
- Contiene los campos por los cuales se puede filtrar. Los campos nulos se ignoran al construir la consulta.
- Incluye además los parámetros de paginación (`offset` y `limit`).
- Usar Lombok `@Getter`, `@Setter` y `@Builder` para reducir código repetitivo.

```java
@Getter
@Setter
@Builder
public class UserCriteria {

    private String email;
    private String name;
    private UserStatus status;
    private LocalDate createdFrom;
    private LocalDate createdTo;

    // Paginación
    private int offset;
    private int limit;
}
```

### JPA Static Metamodel (hibernate-jpamodelgen)

Para construir los `CriteriaBuilder` de forma **type-safe**, se utiliza el **JPA Static Metamodel** generado automáticamente por `hibernate-jpamodelgen` en tiempo de compilación.

#### Configuración Maven

La configuración de `annotationProcessorPaths` con `hibernate-jpamodelgen` y `lombok` en el `maven-compiler-plugin` está documentada en `coding-maven.md`. Aplica a todos los módulos con `packaging: jar`.

#### Resultado de la generación

Para cada entidad `@Entity`, el procesador genera una clase con sufijo `_` en el mismo paquete:

```
User.java   →   User_.java (generado en target/generated-sources/annotations/)
```

La clase generada contiene atributos estáticos tipados (`SingularAttribute`, `ListAttribute`, etc.) que representan cada campo de la entidad:

```java
// Generado automáticamente — NO editar
@StaticMetamodel(User.class)
public abstract class User_ {
    public static volatile SingularAttribute<User, Long> id;
    public static volatile SingularAttribute<User, String> email;
    public static volatile SingularAttribute<User, String> name;
    public static volatile SingularAttribute<User, UserStatus> status;
    public static volatile SingularAttribute<User, LocalDateTime> createdAt;
}
```

#### Reglas de uso

- **Obligatorio** usar los atributos del Static Metamodel (`User_.email`) en lugar de strings literales (`"email"`) al acceder a campos en `CriteriaBuilder`. Esto garantiza seguridad de tipos en tiempo de compilación y evita errores por typos en nombres de campo.
- Nunca usar `root.get("nombreCampo")` — usar siempre `root.get(Entity_.campo)`.
- Los ficheros generados (`*_.java`) no se versionan; se generan en cada build en `target/generated-sources/annotations/`.

### Implementación en el Repository

Usar `JPA Criteria API` con el **Static Metamodel** para construir la consulta dinámicamente a partir de los campos no nulos del objeto Criteria:

```java
@Repository
@RequiredArgsConstructor(onConstructor = @__(@Autowired))
public class UserRepository {

    private final EntityManager entityManager;

    public List<User> findByCriteria(UserCriteria criteria) {
        var cb = entityManager.getCriteriaBuilder();
        var cq = cb.createQuery(User.class);
        var root = cq.from(User.class);

        var predicates = buildPredicates(cb, root, criteria);
        cq.where(predicates.toArray(new Predicate[0]));

        return entityManager.createQuery(cq)
            .setFirstResult(criteria.getOffset())
            .setMaxResults(criteria.getLimit())
            .getResultList();
    }

    public long countByCriteria(UserCriteria criteria) {
        var cb = entityManager.getCriteriaBuilder();
        var cq = cb.createQuery(Long.class);
        var root = cq.from(User.class);

        var predicates = buildPredicates(cb, root, criteria);
        cq.select(cb.count(root));
        cq.where(predicates.toArray(new Predicate[0]));

        return entityManager.createQuery(cq).getSingleResult();
    }

    private List<Predicate> buildPredicates(CriteriaBuilder cb, Root<User> root, UserCriteria criteria) {
        var predicates = new ArrayList<Predicate>();

        if (criteria.getEmail() != null) {
            predicates.add(cb.like(cb.lower(root.get(User_.email)), "%" + criteria.getEmail().toLowerCase() + "%"));
        }
        if (criteria.getName() != null) {
            predicates.add(cb.like(cb.lower(root.get(User_.name)), "%" + criteria.getName().toLowerCase() + "%"));
        }
        if (criteria.getStatus() != null) {
            predicates.add(cb.equal(root.get(User_.status), criteria.getStatus()));
        }
        if (criteria.getCreatedFrom() != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get(User_.createdAt), criteria.getCreatedFrom()));
        }
        if (criteria.getCreatedTo() != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get(User_.createdAt), criteria.getCreatedTo()));
        }

        return predicates;
    }
}
```

### Reglas

- La lógica de construcción de predicados debe estar extraída en un método privado (`buildPredicates`) reutilizado por `findByCriteria` y `countByCriteria` para garantizar consistencia.
- **Siempre** referenciar los campos de la entidad mediante el Static Metamodel (`Entity_.campo`), nunca con strings literales.
- Los campos de texto deben buscarse con `LIKE` case-insensitive por defecto, salvo que el dominio requiera coincidencia exacta.
- Los campos de tipo enum, ID o booleano se buscan con `equal`.
- Los campos de tipo fecha/rango se buscan con `greaterThanOrEqualTo` / `lessThanOrEqualTo`.
- Si el objeto Criteria no tiene ningún campo informado, la consulta devuelve todos los registros (paginados).

### Nomenclatura

| Elemento        | Patrón               | Ejemplo          |
|-----------------|----------------------|------------------|
| Objeto Criteria | `<Entidad>Criteria`  | `UserCriteria`   |
| Método búsqueda | `findByCriteria`     | —                |
| Método conteo   | `countByCriteria`    | —                |

## API REST

Las reglas detalladas de diseño y convenciones de la API REST están en `coding-api.md`.

## Base de Datos y Liquibase

- Usar **Spring Data JPA** para el acceso a datos.
- No usar `ddl-auto: create` o `update` en producción. Las migraciones las gestiona **Liquibase**.
- Los changesets de Liquibase deben ser atómicos, irreversibles salvo rollback explícito, e identificados con autor y fecha: `id: 20240101-create-user-table`.

## Buenas Prácticas

- Inyección de dependencias siempre por constructor. Usar la anotación de Lombok `@RequiredArgsConstructor(onConstructor = @__(@Autowired))` en lugar de escribir el constructor manualmente o usar `@Autowired` en campo:

```java
@Service
@RequiredArgsConstructor(onConstructor = @__(@Autowired))
public class UserService {

    private final UserRepository userRepository;
    private final EmailService emailService;

    // El constructor con @Autowired lo genera Lombok automáticamente
}
```

- No usar `@Autowired` directamente sobre campos ni sobre constructores escritos a mano cuando `@RequiredArgsConstructor` sea suficiente.
- Usar `@Getter`, `@Setter`, `@Builder`, `@ToString`, `@EqualsAndHashCode` de Lombok según necesidad en entidades y clases de dominio.
- Preferir `@Data` solo en clases simples sin herencia; en entidades JPA usar las anotaciones individuales para evitar problemas con `equals`/`hashCode`.
- Usar `Optional<T>` en lugar de retornar `null`.
- Validar entradas con Bean Validation (`@Valid`, `@NotNull`, `@Size`, etc.).
- No capturar excepciones genéricas (`Exception`, `Throwable`) salvo en el manejador global.
- Externalizar toda configuración en `application.yml`. No hardcodear valores.
- Las propiedades de configuración propias de la aplicación deben seguir la convención de nombrado:

  ```
  <nombre-aplicacion>.<funcionalidad>.<propiedad>
  ```

  Empezar siempre por el nombre de la aplicación (en kebab-case), seguido del nombre de la funcionalidad y la propiedad concreta. Esto evita colisiones con propiedades de Spring u otras librerías.

  ```yaml
  # application.yml
  template:
    auth:
      token-expiry-seconds: 900
      refresh-token-expiry-days: 30
    pagination:
      default-page-size: 20
    cluster:
      heartbeat-interval-ms: 5000
  ```

  Y su correspondiente clase de configuración:

  ```java
  @ConfigurationProperties(prefix = "template.auth")
  public record AuthProperties(int tokenExpirySeconds, int refreshTokenExpiryDays) {}
  ```
- Escribir tests unitarios con **JUnit 5** y **Mockito**. Los tests de integración con `@SpringBootTest`.

## Testing

### Herramientas

- **JUnit 5** (`junit-jupiter`) como framework base para todos los tests.
- **Mockito** para mocking en tests unitarios.
- **Spring Boot Test** (`@SpringBootTest`) para tests de integración.
- **Testcontainers** para tests de integración que requieren PostgreSQL real.
- **MockMvc** para tests de la capa web (controladores) sin levantar el servidor completo.
- **Instancio** para la generación automática de objetos de prueba con datos aleatorios.
- **JaCoCo** para medir la cobertura de tests (integrado via `jacoco-maven-plugin`).
- **SonarQube** para el análisis continuo de calidad del código (integrado via `sonar-maven-plugin`).

### Tipos de Tests

#### Tests Unitarios

- Ubicación: `src/test/java` dentro del módulo correspondiente.
- Nomenclatura: `<ClaseTesteada>Test.java` (p. ej. `UserServiceTest.java`).
- Anotar la clase con `@ExtendWith(MockitoExtension.class)`.
- Mockear todas las dependencias externas con `@Mock` e inyectarlas con `@InjectMocks`.
- Un test por comportamiento, no por método.

```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    @Test
    void findById_shouldReturnUser_whenExists() {
        // given
        var user = new User(1L, "test@example.com", "Test User");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        // when
        var result = userService.findById(1L);

        // then
        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.email()).isEqualTo("test@example.com");
    }

    @Test
    void findById_shouldThrow_whenNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.findById(99L))
            .isInstanceOf(EntityNotFoundException.class);
    }
}
```

#### Tests de Controladores (Capa Web)

- Usar `@WebMvcTest(UserController.class)` para cargar solo la capa web.
- Mockear los servicios con `@MockBean`.
- Usar `MockMvc` para simular peticiones HTTP y verificar respuestas.

```java
@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @Test
    void getById_shouldReturn200_whenUserExists() throws Exception {
        var userDto = new UserDto(1L, "test@example.com", "Test User");
        when(userService.findById(1L)).thenReturn(userDto);

        mockMvc.perform(get("/api/v1/users/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1L))
            .andExpect(jsonPath("$.email").value("test@example.com"));
    }
}
```

#### Tests de Integración

- Nomenclatura: `<ClaseTesteada>IT.java` (p. ej. `UserRepositoryIT.java`).
- Usar `@SpringBootTest` para tests que necesiten el contexto completo de Spring.
- Usar **Testcontainers** para levantar una instancia real de PostgreSQL:

```java
@SpringBootTest
@Testcontainers
class UserRepositoryIT {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:18")
        .withDatabaseName("testdb")
        .withUsername("test")
        .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private UserRepository userRepository;

    @Test
    void save_shouldPersistUser() {
        var user = new User(null, "test@example.com", "Test User");
        var saved = userRepository.save(user);

        assertThat(saved.getId()).isNotNull();
    }
}
```

### Convenciones

- Estructura de cada test siguiendo el patrón **given / when / then** con comentarios.
- Usar **AssertJ** (`assertThat`) para las aserciones, no `assertEquals` de JUnit directamente.
- No compartir estado mutable entre tests; cada test debe ser independiente.
- Limpiar datos de test en `@AfterEach` o usar `@Transactional` en tests de integración para rollback automático.
- Los tests de integración (`*IT.java`) se ejecutan con `maven-failsafe-plugin` en la fase `verify`, no en `test`.

### Generación de Datos de Prueba con Instancio

Usar **Instancio** para crear objetos de prueba con datos aleatorios, eliminando la necesidad de construir manualmente objetos con datos ficticios hardcodeados.

#### Dependencia Maven

```xml
<dependency>
    <groupId>org.instancio</groupId>
    <artifactId>instancio-junit</artifactId>
    <scope>test</scope>
</dependency>
```

> La versión la gestiona el BOM de Spring Boot. Si no estuviera incluida, declararla explícitamente en `<dependencyManagement>`.

#### Uso Básico

```java
// Crear un objeto completamente rellenado con datos aleatorios
User user = Instancio.create(User.class);

// Crear una lista de objetos
List<User> users = Instancio.createList(User.class);

// Personalizar campos concretos manteniendo el resto aleatorio
User user = Instancio.of(User.class)
    .set(field(User::getEmail), "fixed@example.com")
    .set(field(User::getStatus), UserStatus.ACTIVE)
    .create();
```

#### Integración con JUnit 5

Usar la anotación `@ExtendWith(InstancioExtension.class)` junto a `@Given` para inyectar objetos directamente como parámetros del test:

```java
@ExtendWith({MockitoExtension.class, InstancioExtension.class})
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    @Test
    void save_shouldReturnSavedUser(@Given User user) {
        when(userRepository.save(user)).thenReturn(user);

        var result = userService.save(user);

        assertThat(result).isEqualTo(user);
    }
}
```

#### Restricciones y Personalización

```java
// Ignorar campos que no deben rellenarse (p. ej. IDs generados por la BD)
User user = Instancio.of(User.class)
    .ignore(field(User::getId))
    .create();

// Generar valores dentro de un rango
Order order = Instancio.of(Order.class)
    .generate(field(Order::getAmount), gen -> gen.doubles().range(1.0, 1000.0))
    .create();

// Reutilizar configuración con un modelo
var model = Instancio.of(User.class)
    .ignore(field(User::getId))
    .set(field(User::getStatus), UserStatus.ACTIVE)
    .toModel();

User user1 = Instancio.create(model);
User user2 = Instancio.create(model);
```

#### Cuándo Usar Instancio

- En tests unitarios para crear objetos de dominio o DTOs sin relevancia en los datos concretos.
- En tests de integración para poblar la base de datos con datos variados.
- Combinar con `set(...)` solo para los campos que el test necesita verificar explícitamente; dejar el resto aleatorio.
- No usar Instancio cuando los datos exactos son parte del escenario de prueba (p. ej. test de validación de formato de email).
