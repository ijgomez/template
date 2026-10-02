---
name: backend-java-spring
description: Applies Java and Spring Boot conventions for backend modules (commons, cluster, domain, core, webapp, ws) while preserving layered architecture and business rules.
---

# Skill: backend-java-spring

Específico de los módulos backend: `commons`, `cluster`, `domain`, `core`, `webapp`, `ws`.
Las reglas transversales (separación por capas, no dependencias cruzadas, no tocar `target/`, alcance mínimo, tests si cambia negocio) están en `AGENTS.md` y no se repiten aquí.

## Ubicación por capa

- `domain`: entidades, persistencia, mapeos y reglas de dominio.
- `core`: lógica de negocio y casos de uso.
- `webapp` / `ws`: controllers, API, validación HTTP y adaptadores de entrada/salida.
- `commons`: utilidades transversales, solo si no introducen dependencias de negocio o dominio.
- `cluster`: coordinación y servicios infraestructurales.

Resuelve el problema en la capa responsable. No metas lógica de negocio en el controller ni la dupliques entre módulos.

## Específico Java / Spring Boot

- La lógica de negocio vive en el servicio o caso de uso, nunca mezclada con detalles HTTP.
- Reutiliza validaciones y utilidades existentes antes de crear nuevas abstracciones.
- Si el cambio afecta contratos o modelos, revisa serialización, validación, endpoints, persistencia y consumidores.

## Verificación

Desde `template/`, limita los tests al módulo afectado con `-pl <modulo> -am` (`commons`, `cluster`, `domain`, `core`, `webapp`, `ws`):

```bash
mvn test -pl core -am
```

## Referencias

- Guía de desarrollo Java / Spring Boot: `template-docs/04-development/coding-guidelines/java-spring-boot.md`
- Guía de compilación y empaquetado: `template-docs/04-development/build.md`
