# Guía de Testing

## Frameworks

- **JUnit** — estructura base de los tests.
- **Mockito** — mocking de dependencias en tests unitarios.
- **Instancio** — generación de datos de prueba realistas y aleatorios.
- **HSQLDB** — base de datos en memoria para tests de integración.
- **Spring Test** — contexto de tests de integración.

## Convenciones

- Los tests siguen la estructura **AAA** (Arrange, Act, Assert).
- Cubrir caminos felices, casos límite y escenarios de error.
- No usar `@SpringBootTest` para tests unitarios; reservarlo para tests de integración que lo justifiquen.
- Nombres de métodos de test descriptivos: `should_returnEmpty_when_noResultsFound`.
- Un solo assert lógico por test (varios asserts sobre el mismo objeto están permitidos).

## Estructura de directorios

Los tests siguen la estructura estándar de Maven:

```
src/test/java/        → Clases de test
src/test/resources/   → Recursos de test (ficheros de configuración, datos de prueba)
```

El paquete del test debe coincidir con el paquete de la clase bajo test.

## Tests unitarios vs integración

| Tipo | Objetivo | Anotaciones | Base de datos |
|------|----------|-------------|---------------|
| Unitario | Lógica de negocio aislada | `@ExtendWith(MockitoExtension.class)` | No |
| Integración | Interacción entre capas | `@SpringBootTest` / `@DataJpaTest` | HSQLDB en memoria |

## Buenas prácticas

- Mockear dependencias externas (DAOs, servicios HTTP, etc.) en tests unitarios.
- No depender del orden de ejecución de los tests.
- Evitar `Thread.sleep()` en tests; usar mecanismos de espera activa si es necesario.
- Los tests de integración deben limpiar su estado (transacciones con rollback o datos dedicados).
- Usar `@Transactional` en tests de integración para auto-rollback.