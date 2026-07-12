# Reglas de Codificación — Maven

## General

- Maven es el sistema de gestión de builds del backend (Java / Spring Boot).
- Usar siempre la versión más reciente estable del Maven Wrapper (`mvnw`) incluido en el proyecto, para garantizar builds reproducibles sin depender de la instalación local.
- El fichero principal es `pom.xml` en la raíz del módulo backend.

## Estructura del POM

- Declarar siempre `<groupId>`, `<artifactId>`, `<version>` y `<packaging>`.
- Usar `<parent>` apuntando a `spring-boot-starter-parent` para heredar la gestión de versiones de Spring Boot.
- Centralizar versiones de dependencias en `<properties>`:

```xml
<properties>
    <java.version>21</java.version>
    <postgresql.version>42.x.x</postgresql.version>
</properties>
```

- No declarar versiones directamente en `<dependency>` si ya están gestionadas por el BOM de Spring Boot.

## Gestión de Dependencias

- Declarar dependencias con el scope correcto:
  - `compile` (por defecto): dependencias necesarias en runtime.
  - `test`: solo para tests (JUnit, Mockito...).
  - `provided`: proporcionadas por el servidor (p. ej. Servlet API).
- Agrupar dependencias por categoría con comentarios: `<!-- Spring -->`, `<!-- Database -->`, `<!-- Test -->`.
- Evitar dependencias transitivas innecesarias usando `<exclusions>` cuando sea preciso.

## Plugins

- Incluir siempre `spring-boot-maven-plugin` para generar el jar ejecutable.
- Usar `maven-surefire-plugin` para la ejecución de tests unitarios.
- Usar `maven-failsafe-plugin` para tests de integración (ficheros `*IT.java`).
- Configurar `maven-compiler-plugin` con `<release>21</release>`.
- En todos los módulos con `packaging: jar`, configurar `annotationProcessorPaths` en `maven-compiler-plugin` con **Lombok** y **hibernate-jpamodelgen** para la generación automática de código en compilación.
- Usar **`jacoco-maven-plugin`** para medir la cobertura de tests.
- Usar **`sonar-maven-plugin`** para analizar la calidad del código con SonarQube.

### Configuración de maven-compiler-plugin (módulos JAR)

Todo módulo con `packaging: jar` (`commons`, `cluster`, `domain`, `core`) debe incluir la configuración de `annotationProcessorPaths` con Lombok y hibernate-jpamodelgen. Esto garantiza que:

- **Lombok** genera getters, setters, constructores y builders en compilación.
- **hibernate-jpamodelgen** genera las clases del JPA Static Metamodel (`Entity_.java`) necesarias para consultas type-safe con `CriteriaBuilder`.

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-compiler-plugin</artifactId>
    <configuration>
        <release>21</release>
        <annotationProcessorPaths>
            <path>
                <groupId>org.projectlombok</groupId>
                <artifactId>lombok</artifactId>
            </path>
            <path>
                <groupId>org.hibernate.orm</groupId>
                <artifactId>hibernate-jpamodelgen</artifactId>
            </path>
        </annotationProcessorPaths>
    </configuration>
</plugin>
```

> Las versiones de ambos procesadores las gestiona el BOM de Spring Boot. No declarar versiones explícitas en `<annotationProcessorPaths>`.

**Nota:** El módulo `webapp` (con `packaging: war`) también debe incluir esta configuración si contiene clases que usan Lombok o entidades JPA. En general, se recomienda declarar esta configuración en el POM padre dentro de `<pluginManagement>` para que todos los módulos la hereden automáticamente.

### Configuración de JaCoCo

```xml
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <executions>
        <execution>
            <id>prepare-agent</id>
            <goals><goal>prepare-agent</goal></goals>
        </execution>
        <execution>
            <id>report</id>
            <phase>verify</phase>
            <goals><goal>report</goal></goals>
        </execution>
    </executions>
</plugin>
```

### Configuración de SonarQube

```xml
<plugin>
    <groupId>org.sonarsource.scanner.maven</groupId>
    <artifactId>sonar-maven-plugin</artifactId>
</plugin>
```

Ejecutar el análisis con:

```bash
./mvnw verify sonar:sonar \
  -Dsonar.projectKey=template \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.token=${SONAR_TOKEN}
```

## Estructura Multi-módulo

El backend sigue una estructura multi-módulo Maven bajo el directorio `template/`:

```
template/
├── pom.xml       ← POM padre (packaging: pom, parent: Spring Boot 4.1.0)
├── commons/      ← Utilidades compartidas
├── cluster/      ← Coordinación de cluster y alta disponibilidad
├── domain/       ← Entidades JPA, DTOs, modelo de dominio
├── core/         ← Servicios, DAOs, lógica de negocio, workers
└── webapp/       ← WAR: controladores, seguridad, configuración
```

- El POM padre declara los módulos, gestiona versiones en `<dependencyManagement>` y no contiene dependencias de aplicación.
- El orden de build y las dependencias entre módulos es:

```
commons
  ↓
cluster  ← commons
  ↓
domain   ← cluster, commons
  ↓
core     ← domain (+ todos los transitivos)
  ↓
webapp   ← core (salida WAR)
```

## Comandos Habituales

```bash
./mvnw clean install              # Compilar, testear y empaquetar
./mvnw spring-boot:run            # Arrancar la aplicación en local
./mvnw test                       # Ejecutar tests unitarios
./mvnw verify                     # Ejecutar tests unitarios + integración + cobertura JaCoCo
./mvnw clean package -DskipTests  # Empaquetar sin ejecutar tests
./mvnw dependency:tree            # Ver árbol de dependencias
./mvnw verify sonar:sonar         # Ejecutar tests, cobertura y análisis SonarQube
```

## Buenas Prácticas

- No hacer commit del directorio `target/`.
- Versionar el Maven Wrapper (`.mvn/` y `mvnw`) en el repositorio.
- Usar perfiles (`<profiles>`) para configuraciones específicas de compilación: `local` (entorno local), `dist` (distribución para el resto de entornos) y `test` (ejecución de tests y cobertura). Ver `structure.md` para el detalle de entornos.
- Mantener el `pom.xml` ordenado y legible; evitar bloques de XML innecesarios.
