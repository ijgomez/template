# Reglas de API REST

Aplica a controladores y contratos de API en los módulos `ws` y `webapp`.

## Principios y Convenciones

- Diseña endpoints siguiendo convenciones RESTful estándar (nombres en plural para recursos, verbos HTTP adecuados, códigos de estado coherentes).
- Uso de DTOs específicos para entrada y salida, evitando exponer directamente las entidades de dominio JPA.
- Validación exhaustiva de entrada mediante Bean Validation (`@Valid`, `@NotNull`, etc.).
- Respuestas de error estandarizadas con código de error, mensaje descriptivo y detalles cuando aplique.
- Documentación OpenAPI/Swagger actualizada.
- Sigue la guía oficial: [template-docs/04-development/coding-guidelines/api-rest.md](file:///Users/ijgomez/Documents/workspace/template/template-docs/04-development/coding-guidelines/api-rest.md).
