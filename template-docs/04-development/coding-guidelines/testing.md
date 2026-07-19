# Guía de Testing

## Frameworks permitidos

| Framework | Uso |
|-----------|-----|
| **JUnit 5** (`junit-jupiter`) | Estructura base de los tests |
| **Mockito** | Mocking de dependencias en tests unitarios |
| **AssertJ** | Aserciones fluidas y legibles |
| **Instancio** | Generación automática de objetos de prueba con datos aleatorios |
| **MockMvc** | Tests de controladores REST sin levantar servidor |
| **Testcontainers** | Contenedores Docker para tests de integración (PostgreSQL real) |
| **WireMock** | Simulación de servicios HTTP externos |
| **JaCoCo** | Cobertura de código (integrado via `jacoco-maven-plugin`) |
| **SonarQube** | Análisis continuo de calidad del código (integrado via `sonar-maven-plugin`) |
| **Spring Boot Test** | Contexto de tests de integración (`@SpringBootTest`) |
| **Spring Security Test** | Utilidades para testear seguridad (`@WithMockUser`, etc.) |
| **JSONAssert** | Comparación y validación de respuestas JSON |
| **Awaitility** | Espera activa para procesos asíncronos |
| **ArchUnit** | Validación de reglas de arquitectura mediante tests |

> **IMPORTANTE:** No se permite usar ningún framework de testing fuera de esta lista sin aprobación explícita. En particular, NO usar HSQLDB ni H2 como base de datos para tests de integración; usar siempre Testcontainers con PostgreSQL para reflejar el motor de producción.

## Tipos de Tests

### Tests Unitarios

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

### Tests de Controladores (Capa Web)

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

### Tests de Integración

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

## Convenciones

- Estructura de cada test siguiendo el patrón **given / when / then** con comentarios.
- Usar **AssertJ** (`assertThat`) para las aserciones, no `assertEquals` de JUnit directamente.
- Nombres de métodos de test descriptivos: `should_returnEmpty_when_noResultsFound`.
- Un solo assert lógico por test (varios asserts sobre el mismo objeto están permitidos).
- No compartir estado mutable entre tests; cada test debe ser independiente.
- No depender del orden de ejecución de los tests.
- Limpiar datos de test en `@AfterEach` o usar `@Transactional` en tests de integración para rollback automático.
- Los tests de integración (`*IT.java`) se ejecutan con `maven-failsafe-plugin` en la fase `verify`, no en `test`.
- No usar `@SpringBootTest` para tests unitarios; reservarlo para tests de integración que lo justifiquen.
- Cubrir caminos felices, casos límite y escenarios de error.
- Evitar `Thread.sleep()` en tests; usar **Awaitility** para espera activa en procesos asíncronos.

## Estructura de directorios

Los tests siguen la estructura estándar de Maven:

```
src/test/java/        → Clases de test
src/test/resources/   → Recursos de test (ficheros de configuración, datos de prueba)
```

El paquete del test debe coincidir con el paquete de la clase bajo test.

## Generación de Datos de Prueba con Instancio

Usar **Instancio** para crear objetos de prueba con datos aleatorios, eliminando la necesidad de construir manualmente objetos con datos ficticios hardcodeados.

### Dependencia Maven

```xml
<dependency>
    <groupId>org.instancio</groupId>
    <artifactId>instancio-junit</artifactId>
    <scope>test</scope>
</dependency>
```

> La versión la gestiona el BOM de Spring Boot. Si no estuviera incluida, declararla explícitamente en `<dependencyManagement>`.

### Uso Básico

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

### Integración con JUnit 5

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

### Restricciones y Personalización

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

### Cuándo Usar Instancio

- En tests unitarios para crear objetos de dominio o DTOs sin relevancia en los datos concretos.
- En tests de integración para poblar la base de datos con datos variados.
- Combinar con `set(...)` solo para los campos que el test necesita verificar explícitamente; dejar el resto aleatorio.
- **No** usar Instancio cuando los datos exactos son parte del escenario de prueba (p. ej. test de validación de formato de email).
