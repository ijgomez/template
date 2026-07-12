# Instrucciones de Copilot para este repositorio

Aplica estas reglas especificas del repositorio al generar codigo.

## Arquitectura y modulos

- Mantener el backend alineado con la estructura Maven multimodulo.
- Respetar la organizacion por funcionalidades.
- Mantener la logica de negocio en servicios, no en controladores.

## Reglas de Java y Spring

- Usar convenciones de Java 21.
- Seguir el estilo de Spring Boot ya definido en el proyecto.
- Usar Lombok cuando sea apropiado para reducir boilerplate.
- Mantener nombres consistentes con sufijos por rol:
  - Las clases de servicio terminan en Service.
  - Las clases de repositorio terminan en Repository.
  - Las implementaciones REST terminan en ControllerImpl.

## Reglas de API REST

- Mantener endpoints bajo /api/v1/.
- Usar nombres de recursos en plural.
- Preferir interfaz mas implementacion para controladores.
- Devolver ResponseEntity para control explicito de estados HTTP.
- Usar DTOs como frontera de la API.

## Reglas de seguridad

- Seguir el principio deny-by-default.
- Mantener la autorizacion explicita con anotaciones a nivel de metodo cuando aplique.
- No registrar ni exponer datos sensibles.

## Reglas de Maven y calidad

- Usar comandos con Maven Wrapper.
- Mantener versiones de dependencias centralizadas.
- Conservar plugins base y configuracion del compilador.
- En modulos jar, mantener annotation processors para Lombok y metamodelo JPA.

## Reglas de Liquibase

- Agregar cambios de esquema mediante changelogs XML de Liquibase.
- Mantener inmutables los changesets una vez aplicados.
- Incluir comentarios y precondiciones significativas.
- Agregar rollback cuando corresponda.

## Reglas de frontend

- Mantener el codigo Angular fuertemente tipado.
- Ubicar llamadas API en servicios, no en componentes.
- Mantener configuracion de runtime en environment.

## Actualizacion de documentacion

- Si cambian versiones del stack, dependencias o estructura de build, actualizar la documentacion de steering en consecuencia.
