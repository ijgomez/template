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
| **Playwright** | Tests end-to-end (E2E) de la interfaz de usuario |

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

## Validación de Arquitectura con ArchUnit

Usar **ArchUnit 1.5.0** para verificar mediante tests que la estructura del código cumple las reglas arquitectónicas del proyecto (dependencias entre capas, convenciones de nombres, restricciones de paquetes, etc.).

### Dependencia Maven

```xml
<dependency>
    <groupId>com.tngtech.archunit</groupId>
    <artifactId>archunit-junit5</artifactId>
    <version>1.5.0</version>
    <scope>test</scope>
</dependency>
```

### Nomenclatura y Ubicación

- Nomenclatura: `<Módulo>ArchitectureTest.java` o `<Aspecto>ArchitectureTest.java` (p. ej. `LayerArchitectureTest.java`, `NamingConventionsArchitectureTest.java`).
- Ubicación: `src/test/java` en el módulo que se quiere validar, dentro de un paquete `architecture` bajo el paquete raíz del módulo.
- Ejemplo: `org.myorganization.template.core.architecture.LayerArchitectureTest`.

### Uso Básico

```java
@AnalyzeClasses(packages = "org.myorganization.template", importOptions = ImportOption.DoNotIncludeTests.class)
class LayerArchitectureTest {

    @ArchTest
    static final ArchRule layer_dependencies_are_respected = layeredArchitecture()
            .consideringAllDependencies()
            .layer("Web").definedBy("..web..")
            .layer("Core").definedBy("..core..")
            .layer("Domain").definedBy("..domain..")
            .layer("Commons").definedBy("..commons..")
            .whereLayer("Web").mayNotBeAccessedByAnyLayer()
            .whereLayer("Core").mayOnlyBeAccessedByLayers("Web")
            .whereLayer("Domain").mayOnlyBeAccessedByLayers("Core", "Web")
            .whereLayer("Commons").mayOnlyBeAccessedByLayers("Core", "Domain", "Web");
}
```

### Reglas Recomendadas

```java
@AnalyzeClasses(packages = "org.myorganization.template", importOptions = ImportOption.DoNotIncludeTests.class)
class NamingConventionsArchitectureTest {

    @ArchTest
    static final ArchRule services_should_be_suffixed = classes()
            .that().areAnnotatedWith(Service.class)
            .should().haveSimpleNameEndingWith("Service");

    @ArchTest
    static final ArchRule repositories_should_be_suffixed = classes()
            .that().areAnnotatedWith(Repository.class)
            .should().haveSimpleNameEndingWith("Repository");

    @ArchTest
    static final ArchRule controllers_impl_should_be_suffixed = classes()
            .that().areAnnotatedWith(RestController.class)
            .should().haveSimpleNameEndingWith("ControllerImpl");

    @ArchTest
    static final ArchRule domain_should_not_depend_on_spring = noClasses()
            .that().resideInAPackage("..domain..")
            .should().dependOnClassesThat()
            .resideInAnyPackage("org.springframework..");
}
```

### Convenciones

- Los tests de ArchUnit se ejecutan como tests unitarios normales (fase `test` de Maven).
- Usar `@AnalyzeClasses` con `importOptions = ImportOption.DoNotIncludeTests.class` para excluir clases de test del análisis.
- Declarar las reglas como campos `static final` con `@ArchTest` para aprovechar el caché de clases importadas.
- Agrupar reglas relacionadas en la misma clase de test (capas, nomenclatura, dependencias, etc.).
- Si una regla falla, corregir el código, no desactivar la regla. Solo se permite `@ArchIgnore` temporalmente con un comentario que justifique y un ticket asociado.
- Mantener las reglas sincronizadas con las convenciones documentadas en este proyecto (sufijos de clases, dependencias entre módulos, restricciones de paquetes).

## Tests End-to-End (E2E) con Playwright

Usar **Playwright** para tests de interfaz de usuario que validan flujos completos del usuario contra la aplicación desplegada (frontend Angular + backend Spring Boot).

### Instalación

```bash
npm init playwright@latest
```

Esto genera la estructura base con `playwright.config.ts` y el directorio `tests/`.

### Estructura de Directorios

```
e2e/
├── playwright.config.ts       # Configuración de Playwright
├── tests/
│   ├── auth/
│   │   └── login.spec.ts      # Tests del flujo de login
│   ├── users/
│   │   └── user-crud.spec.ts  # Tests CRUD de usuarios
│   └── ...
├── pages/                     # Page Object Model
│   ├── login.page.ts
│   ├── users.page.ts
│   └── ...
└── fixtures/                  # Fixtures y datos de prueba
    └── test-data.ts
```

### Nomenclatura

- Ficheros de test: `<funcionalidad>.spec.ts` (p. ej. `login.spec.ts`, `user-crud.spec.ts`).
- Page Objects: `<página>.page.ts` (p. ej. `login.page.ts`, `users.page.ts`).
- Organizar tests por feature/módulo funcional dentro de `e2e/tests/`.

### Page Object Model (POM)

Usar el patrón Page Object para encapsular la interacción con las páginas y facilitar el mantenimiento:

```typescript
import { type Locator, type Page } from '@playwright/test';

export class LoginPage {
  private readonly page: Page;
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByTestId('username-input');
    this.passwordInput = page.getByTestId('password-input');
    this.submitButton = page.getByTestId('login-button');
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

### Uso Básico

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

test.describe('Login', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Act
    await loginPage.login('admin', 'admin123');

    // Assert
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByTestId('user-menu')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.login('admin', 'wrong-password');

    await expect(page.getByTestId('error-message')).toBeVisible();
    await expect(page.getByTestId('error-message')).toContainText('Invalid credentials');
  });
});
```

### Configuración Recomendada (`playwright.config.ts`)

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['junit', { outputFile: 'results.xml' }]],
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
  ],
  webServer: {
    command: 'ng serve --configuration=test',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Convenciones

- Seleccionar elementos siempre por `data-testid` (preferido) o por rol accesible (`getByRole`). Nunca por selectores CSS frágiles o clases de estilo.
- Usar el patrón **Arrange / Act / Assert** en cada test.
- Cada test debe ser independiente y no depender del estado dejado por otro test.
- Usar `test.describe` para agrupar tests del mismo flujo funcional.
- Configurar `webServer` en `playwright.config.ts` para que Playwright levante automáticamente el frontend antes de ejecutar los tests.
- En CI, ejecutar contra la aplicación completa (frontend + backend + base de datos con Testcontainers o entorno de integración).
- Generar reportes HTML y JUnit XML para integración con el pipeline de CI.
- Los tests E2E se ejecutan como paso separado en el pipeline, después de los tests unitarios y de integración.
- Mantener los tests E2E enfocados en flujos críticos de negocio; no duplicar la cobertura de tests unitarios o de componente.
