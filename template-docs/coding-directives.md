# Analisis de .kiro

Este documento resume las directrices encontradas en `.kiro/steering` y las transforma en reglas operativas para el equipo.

## Vision general

- Proyecto plantilla para stack Java + Spring Boot + Angular.
- Arquitectura principal multimodulo Maven en backend.
- Frontend separado en Angular.
- Migraciones de base de datos controladas por Liquibase.
- Seguridad con Spring Security y JWT.

## Stack objetivo

- Java 21
- Spring Boot 4.1.0
- PostgreSQL 18
- Liquibase
- Angular 22
- Bootstrap 5.3.8

## Reglas clave de backend

- Organizacion por funcionalidad, no por capa.
- Sin logica de negocio en controladores.
- Sin dependencias de Spring en el modulo de dominio, salvo JPA.
- Repositorios con busqueda por criterios paginada cuando aplique.
- Uso obligatorio de nombres consistentes para clases anotadas con Service, Repository y Controller.

## Reglas clave de API

- Prefijo base: /api/v1/.
- Recursos en plural y acciones por verbo HTTP.
- Patron interfaz + implementacion para controladores.
- DTOs para entrada y salida. No exponer entidades JPA.
- Manejo de errores centralizado con un formato uniforme.

## Reglas clave de seguridad

- Deny by default.
- JWT stateless con expiracion corta en access token.
- Autorizacion con anotaciones de metodo.
- CORS centralizado en configuracion de seguridad.
- Nunca exponer ni registrar datos sensibles.

## Reglas clave de Maven

- Uso del wrapper del proyecto.
- Versiones centralizadas en properties.
- Plugins base: compiler, surefire, failsafe, jacoco, sonar y spring-boot.
- Annotation processors en modulos jar: Lombok + hibernate-jpamodelgen.

## Reglas clave de Liquibase

- Changelogs en XML.
- Changesets inmutables una vez aplicados.
- Organizacion por version y etiquetas labels por version.
- Cada changeset con comment, preConditions y rollback cuando aplique.

## Reglas clave de frontend

- Angular en modo estricto.
- Componentes pequenos, preferiblemente standalone.
- Servicios para llamadas HTTP, no en componentes.
- Configuracion en environment, no hardcode.
- Tipado fuerte y tests de comportamiento.
