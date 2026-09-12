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
- `jacoco-maven-plugin` para cobertura de tests. Configurado en el POM padre y **activo por defecto** en todos los módulos que compilan Java (declarado en `<build><plugins>`), por lo que la cobertura se mide por módulo en cualquier `mvn verify` sin necesidad de activar el perfil `test`. Genera reportes separados para tests unitarios (Surefire → `jacoco.exec`, reporte en `target/site/jacoco`) e integración (Failsafe → `jacoco-it.exec`, reporte en `target/site/jacoco-it`), más un reporte combinado (`jacoco-merged.exec` → `target/site/jacoco-merged`). Los módulos sin tests no generan datos hasta que se les añadan tests. Del cálculo de cobertura se **excluye el modelo de datos sin lógica de negocio** vía `<excludes>` del plugin (patrones sobre la clase compilada): `**/dto/**`, `**/criteria/**`, `**/enums/**`, `**/exception/**` y las entities JPA que son sólo getters/setters. Se mantiene en cobertura las clases del paquete `entity` con lógica real (`BaseEntity` y las claves compuestas `*PK`). Al añadir nuevas entities-POJO o DTOs sueltos sin lógica, agregar su exclusión (p. ej. `**/entity/<Nombre>.class`). Además, `webapp` genera un **reporte agregado** (`report-aggregate`) con la cobertura de todos los módulos del reactor en `webapp/target/site/jacoco-aggregate`; para ello `webapp` declara explícitamente como dependencia todos los módulos (`commons`, `cluster`, `domain`, `core`, `ws`), que ya llegaban en compile de forma transitiva. El agregado se obtiene ejecutando el reactor completo (`mvn verify`).
- `sonar-maven-plugin` para análisis de calidad.
- `frontend-maven-plugin` (com.github.eirslett, v1.15.1) en el módulo **`dashboard`**: instala Node.js, ejecuta `npm install`, compila el frontend Angular (`generate-resources`) y ejecuta sus **tests unitarios** (`ng test --no-watch`) en la fase `test` de Maven. Skippable con `-Dfrontend.skip=true` (todo el frontend) o `-Dfrontend.test.skip=true` (solo los tests de Angular). El módulo `webapp` ya no compila el frontend: solo copia el `dist/` generado por `dashboard` al WAR (paso también gobernado por `frontend.skip`) y declara una dependencia `pom`/`provided` a `template-dashboard` para forzar el orden del reactor.
- `liquibase-maven-plugin` (org.liquibase) en `domain`: ejecución manual de migraciones (`mvn liquibase:update`) usando `src/main/resources/liquibase.properties`. Sus dependencias (`liquibase-core`, `postgresql`) se declaran **dentro de `<plugin><dependencies>`**, no como dependencias del módulo, para que `domain` siga siendo Java puro en compile.

## Estructura Multi-módulo

```
template/
├── pom.xml       (POM padre, packaging: pom, parent: Spring Boot 4.1.1)
├── commons/
├── cluster/
├── domain/
├── core/
├── ws/
├── dashboard/    (frontend Angular, packaging: pom; build y tests vía frontend-maven-plugin)
└── webapp/       (WAR; empaqueta el dist/ del dashboard)
```

Orden de reactor: `commons → cluster → domain → core → ws → dashboard → webapp`
(el `dashboard` se construye antes que `webapp` para que el `dist/` exista al empaquetar el WAR).

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
