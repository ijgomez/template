# Reglas de Codificación — Java / Spring Boot

Aplica a los módulos backend (`commons`, `cluster`, `domain`, `core`, `ws`, `webapp`).

## Principios y Convenciones

- **Separación de capas**:
  - `domain`: entidades, repositorios y reglas de dominio.
  - `core`: lógica de negocio y servicios de aplicación.
  - `ws` / `webapp`: controladores REST, DTOs y validación de entrada/salida HTTP.
  - `commons`: utilidades transversales (sin acoplar a negocio ni dominio).
  - `cluster`: alta disponibilidad, coordinación e infraestructura.
- La lógica de negocio reside siempre en servicios del `core`, nunca en controllers ni entities.
- Reutiliza utilidades y validaciones existentes antes de crear nuevas abstracciones.
- Mantén la trazabilidad, seguridad, auditoría y gestión uniforme de excepciones.
- Sigue la guía oficial del proyecto: [template-docs/04-development/coding-guidelines/java-spring-boot.md](file:///Users/ijgomez/Documents/workspace/template/template-docs/04-development/coding-guidelines/java-spring-boot.md).
