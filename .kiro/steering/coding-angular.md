# Reglas de Codificación — Angular / Frontend

## General

- Versión: **Angular 22**.
- Framework de estilos: **Bootstrap 5.3.8**.
- Todo el código debe estar en inglés (nombres de clases, métodos, variables y comentarios técnicos).
- Usar **TypeScript strict mode** activado.

## Nomenclatura

| Elemento            | Convención                          | Ejemplo                    |
|---------------------|-------------------------------------|----------------------------|
| Componentes         | PascalCase + sufijo                 | `UserListComponent`        |
| Servicios           | PascalCase + sufijo                 | `AuthService`              |
| Ficheros            | kebab-case + tipo                   | `user-list.component.ts`   |
| Variables y métodos | camelCase                           | `getUserById`, `isLoading` |
| Constantes          | UPPER_SNAKE_CASE                    | `API_BASE_URL`             |
| Interfaces          | PascalCase con prefijo `I` opcional | `User`, `IUserResponse`    |

## Estructura de Carpetas

Organizar por funcionalidad (feature modules):

```
src/
└── app/
    ├── core/               # Servicios singleton, guards, interceptors
    ├── shared/             # Componentes, pipes y directivas reutilizables
    ├── features/
    │   ├── user/
    │   │   ├── components/
    │   │   ├── services/
    │   │   ├── models/
    │   │   └── user.module.ts
    │   └── ...
    └── app.module.ts
```

## Componentes

- Preferir **componentes standalone** (Angular 22).
- Mantener los componentes pequeños y con una única responsabilidad.
- Separar siempre template (`.html`), estilos (`.scss`) y lógica (`.ts`).
- Usar `OnPush` como estrategia de detección de cambios cuando sea posible.
- Desuscribirse de observables en `ngOnDestroy` o usar `takeUntilDestroyed()`.

## Servicios

- Los servicios de acceso a la API deben vivir en `core/` o en la carpeta `services/` de su feature.
- Usar `HttpClient` para las llamadas HTTP. Nunca hacer llamadas HTTP desde un componente directamente.
- Gestionar errores HTTP con `catchError` en el servicio.

## Estilos con Bootstrap

- Usar las clases utilitarias de Bootstrap 5 en lugar de estilos inline.
- Los estilos específicos de componente van en el fichero `.scss` del componente.
- Usar variables SCSS de Bootstrap para personalizar colores y tamaños, no sobreescribir clases directamente.
- Evitar `!important`.

## Buenas Prácticas

- Tipar siempre: no usar `any` salvo justificación excepcional.
- Usar modelos/interfaces para los datos de la API (carpeta `models/`).
- Gestionar el estado de carga y error en los componentes que consumen observables.
- Lazy loading para los feature modules.
- Escribir tests unitarios con **Jasmine/Karma** o **Jest**.

## Configuración y Propiedades

Toda variable configurable del frontend debe declararse en `environment.ts` (y sus variantes por entorno) siguiendo la convención:

```
<nombreAplicacion>.<funcionalidad>.<propiedad>
```

- Empezar siempre por el nombre de la aplicación, seguido del nombre de la funcionalidad, y a continuación la propiedad concreta.
- Usar camelCase para cada segmento.

```typescript
// environment.ts
export const environment = {
  production: false,
  template: {
    api: {
      baseUrl: 'http://localhost:8080',
      timeout: 30000,
    },
    auth: {
      tokenExpiryMarginSeconds: 60,
    },
    pagination: {
      defaultPageSize: 20,
    },
  },
};
```

- Nunca hardcodear URLs, timeouts ni otros valores configurables directamente en servicios o componentes; referenciar siempre `environment.<nombreAplicacion>.<funcionalidad>.<propiedad>`.

## Testing

### Herramientas

- **Jest** como framework principal de testing (reemplaza Karma/Jasmine en proyectos nuevos).
- **Angular Testing Library** (`@testing-library/angular`) para tests de componentes centrados en el comportamiento del usuario.
- **HttpClientTestingModule** para mockear llamadas HTTP en tests de servicios.
- `TestBed` de `@angular/core/testing` para configurar el entorno de test.

### Tipos de Tests

#### Tests de Servicios

- Mockear el `HttpClient` con `HttpClientTestingModule` y `HttpTestingController`.
- Verificar que se realizan las peticiones HTTP correctas y se manejan los errores.

```typescript
describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService],
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should fetch user by id', () => {
    const mockUser: User = { id: 1, email: 'test@example.com', name: 'Test' };

    service.getById(1).subscribe(user => {
      expect(user).toEqual(mockUser);
    });

    const req = httpMock.expectOne('/api/v1/users/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockUser);
  });
});
```

#### Tests de Componentes

- Usar `TestBed.configureTestingModule` para declarar el componente y sus dependencias.
- Mockear los servicios con `jasmine.createSpyObj` o proveedores personalizados.
- Verificar el DOM renderizado con `fixture.nativeElement` o `screen` de Testing Library.
- Preferir tests que interactúen con el componente como lo haría el usuario (clics, inputs).

```typescript
describe('UserListComponent', () => {
  let fixture: ComponentFixture<UserListComponent>;
  let userServiceMock: jasmine.SpyObj<UserService>;

  beforeEach(() => {
    userServiceMock = jasmine.createSpyObj('UserService', ['getAll']);
    userServiceMock.getAll.and.returnValue(of([{ id: 1, email: 'a@b.com', name: 'A' }]));

    TestBed.configureTestingModule({
      imports: [UserListComponent],
      providers: [{ provide: UserService, useValue: userServiceMock }],
    });

    fixture = TestBed.createComponent(UserListComponent);
    fixture.detectChanges();
  });

  it('should display user list', () => {
    const items = fixture.nativeElement.querySelectorAll('[data-testid="user-item"]');
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('A');
  });
});
```

#### Tests de Guards e Interceptors

- Testear guards verificando que redirigen correctamente cuando el usuario no está autenticado.
- Testear interceptors comprobando que añaden las cabeceras esperadas a las peticiones.

### Convenciones

- Nomenclatura: `<nombre>.spec.ts` junto al fichero testeado (p. ej. `user.service.spec.ts`).
- Estructura de cada test siguiendo el patrón **arrange / act / assert**.
- Un `describe` por clase o componente; un `it` por comportamiento.
- Usar `data-testid` en el template para seleccionar elementos en los tests, no clases CSS ni selectores frágiles.
- No testear detalles de implementación; testear comportamiento observable.
- Ejecutar tests con `ng test --no-watch` (o `jest --runInBand`) en CI para ejecución única sin modo watch.
