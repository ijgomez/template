# Reglas de Codificación — Maven

Directrices para la gestión de builds del backend con Maven.

## General

- Maven es el sistema de gestión de builds del backend (Java / Spring Boot).
- Usar siempre la versión más reciente estable del Maven Wrapper (`mvnw`) incluido en el proyecto.
- El fichero principal es `pom.xml` en la raíz del módulo backend.

## Estructura del POM

- Declarar siempre `<groupId>`, `<artifactId>`, `<version>` y `<packaging>`.
- Usar `<parent>` apuntando a `spring-boot-starter-parent` para heredar la gestión de versiones.
- Centralizar versiones de dependencias en `<properties>`.
- No declarar versiones directamente en `<dependency>` si ya están gestionadas por el BOM de Spring Boot.

## Gestión de Dependencias

- Scopes: `compile` (por defecto), `test`, `provided`.
- Agrupar dependencias por categoría con comentarios.
- Evitar dependencias transitivas innecesarias con `<exclusions>`.

## Plugins

- `spring-boot-maven-plugin` para generar el jar ejecutable.
- `maven-surefire-plugin` para tests unitarios.
- `maven-failsafe-plugin` para tests de integración (`*IT.java`).
- `maven-compiler-plugin` con `<release>21</release>` y `annotationProcessorPaths` (Lombok + hibernate-jpamodelgen).
- `jacoco-maven-plugin` para cobertura de tests.
- `sonar-maven-plugin` para análisis de calidad.
- `frontend-maven-plugin` (com.github.eirslett, v1.15.1) en webapp: instala Node.js, ejecuta `npm install` y compila el frontend Angular. Skippable con `-Dfrontend.skip=true`.

## Estructura Multi-módulo

```
template/
├── pom.xml       (POM padre, packaging: pom, parent: Spring Boot 4.1.0)
├── commons/
├── cluster/
├── domain/
├── core/
└── webapp/
```

## Comandos Habituales

```bash
./mvnw clean install              # Compilar, testear y empaquetar
./mvnw spring-boot:run            # Arrancar la aplicación en local
./mvnw test                       # Ejecutar tests unitarios
./mvnw verify                     # Tests unitarios + integración + cobertura JaCoCo
./mvnw clean package -DskipTests  # Empaquetar sin ejecutar tests
./mvnw verify sonar:sonar         # Tests, cobertura y análisis SonarQube
```

## Buenas Prácticas

- No hacer commit del directorio `target/`.
- Versionar el Maven Wrapper (`.mvn/` y `mvnw`).
- Usar perfiles: `local`, `dist`, `test`.
- Mantener el `pom.xml` ordenado y legible.
