# Correcciones post-scaffolding

## Introducción

Tras la ejecución de la tarea inicial de scaffolding del proyecto (Task 0: Project structure scaffolding), se identificaron cinco desviaciones respecto a las convenciones definidas en la documentación del proyecto. Todas fueron corregidas antes de continuar con la implementación.

> **Nota histórica:** Este documento describe correcciones realizadas justo después del scaffolding inicial. Con posterioridad, el proyecto se reorganizó: el frontend Angular se movió a `template/template/dashboard/` (renombrado a `dashboard`) y los changelogs de Liquibase se integraron en el módulo `domain` (`template/template/domain/src/main/resources/db/changelog/`), eliminando el proyecto independiente `template-liquibase`. Los diagramas de "Convención esperada" de este documento reflejan la estructura vigente tras esa reorganización; las secciones de "Problema detectado" y las tablas de cambios conservan el estado del momento en que se aplicaron las correcciones.

---

## Corrección 1: Estructura de directorios del backend

### Problema detectado

La tarea de scaffolding generó los módulos Maven del backend con el prefijo `template-` en los nombres de directorio, situándolos directamente en la raíz del workspace:

```text
template/                   ← raíz del workspace
├── pom.xml                 ← POM padre en la raíz
├── template-commons/
├── template-cluster/
├── template-domain/
├── template-core/
├── template-webapp/
└── template-liquibase/     ← incluido como submódulo Maven
```

### Convención esperada

Según `template-docs/01-introduction/project-structure.md`, la estructura correcta es:

```text
template/                   ← raíz del workspace
├── template/               ← backend principal (multi-módulo Maven)
│   ├── pom.xml
│   ├── commons/
│   ├── cluster/
│   ├── domain/             ← entidades JPA + migraciones Liquibase (db/changelog/**)
│   ├── core/
│   ├── webapp/
│   └── dashboard/          ← frontend Angular
└── template-docs/          ← documentación
```

### Cambios aplicados

| Aspecto                       | Antes                                          | Después                                               |
|-------------------------------|------------------------------------------------|-------------------------------------------------------|
| Ubicación del POM padre       | `template/pom.xml` (raíz)                      | `template/template/pom.xml`                           |
| Nombres de módulos            | `template-commons/`, `template-cluster/`, etc. | `commons/`, `cluster/`, `domain/`, `core/`, `webapp/` |
| Ubicación de módulos          | Raíz del workspace                             | Dentro de `template/template/`                        |
| Migraciones Liquibase         | Submódulo Maven del POM padre                  | Integradas en el módulo `domain` (`db/changelog/**`)  |
| Declaración de módulos en POM | `<module>template-commons</module>`            | `<module>commons</module>`                            |

**Nota:** Los `artifactId` de cada módulo se mantienen con el prefijo `template-` (e.g., `template-commons`, `template-core`). Solo los nombres de directorio cambian.

---

## Corrección 2: GroupId y paquete Java raíz

### Problema detectado

La tarea de scaffolding utilizó `com.ijgomez.template` como `groupId` en todos los POMs y como paquete raíz en el código Java:

```xml
<groupId>com.ijgomez.template</groupId>
```

```java
package com.ijgomez.template.core;
```

### Convención esperada

Según `template-docs/04-development/coding-guidelines/java-spring-boot.md`, el paquete raíz del proyecto es `org.myorganization.template`:

| Módulo Maven | Paquete base                          |
|--------------|---------------------------------------|
| `commons`    | `org.myorganization.template.commons` |
| `cluster`    | `org.myorganization.template.cluster` |
| `domain`     | `org.myorganization.template.domain`  |
| `core`       | `org.myorganization.template.core`    |
| `webapp`     | `org.myorganization.template.web`     |

### Cambios aplicados

| Aspecto                  | Antes                                 | Después                                      |
|--------------------------|---------------------------------------|----------------------------------------------|
| `groupId` en POMs        | `com.ijgomez.template`                | `org.myorganization.template`                |
| Paquete Java             | `com.ijgomez.template.*`              | `org.myorganization.template.*`              |
| Directorios de fuentes   | `src/main/java/com/ijgomez/template/` | `src/main/java/org/myorganization/template/` |
| `scanBasePackages`       | `com.ijgomez.template`                | `org.myorganization.template`                |
| Configuración de logging | `com.ijgomez.template: DEBUG`         | `org.myorganization.template: DEBUG`         |

Los cambios se aplicaron en:
- 7 ficheros POM (parent + 5 módulos + template-liquibase)
- 6 ficheros Java (package-info.java de cada módulo + TemplateApplication.java)
- 1 fichero de configuración (application-local.yml)

---

## Corrección 3: Proyectos auxiliares no generados (template-docker y template-dist)

### Problema detectado

La tarea de scaffolding solo generó los proyectos de código (backend, frontend y migraciones), pero omitió la creación de los proyectos auxiliares de infraestructura definidos en la estructura del proyecto:

- `template-docker/` — Contenedores Docker y Docker Compose
- `template-dist/` — Scripts de compilación y despliegue

### Convención esperada

Según `template-docs/01-introduction/project-structure.md`, la estructura completa del workspace incluye:

```text
template/                          ← Raíz del workspace
├── template/                      ← Backend principal (incluye dashboard/ y las migraciones en domain/)
├── template-dist/                 ← Scripts de compilación y despliegue
├── template-docker/               ← Contenedores Docker y Docker Compose
├── template-properties/           ← Configuración por entorno
└── template-docs/                 ← Documentación
```

### Acción correctiva

Se añadieron dos nuevas subtareas al plan de implementación (Task 0.3 y Task 0.4) para completar el scaffolding:

| Tarea | Proyecto           | Contenido esperado                                                                                                                                                    |
|-------|--------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 0.3   | `template-docker/` | `docker-compose.yml` (PostgreSQL 18, Backend, Frontend), Dockerfiles multi-stage para backend (Maven + JDK 21) y frontend (Node + Nginx), `.env.example`, `README.md` |
| 0.4   | `template-dist/`   | Scripts de build, package y deploy organizados por SO, `README.md` con documentación de uso                                                                           |

**Nota:** `template-properties/` no se incluyó en esta fase porque su contenido depende de la configuración específica de cada entorno, que se definirá en tareas posteriores (Task 15.6).

---

## Corrección 4: Entornos de Angular no alineados con perfiles Maven

### Problema detectado

La tarea de scaffolding generó el proyecto Angular con dos configuraciones genéricas: `development` y `production`, con los ficheros `environment.ts` y `environment.prod.ts`:

```json
"configurations": {
  "development": { ... },
  "production": { ... }
}
```

### Convención esperada

Las configuraciones de Angular deben estar alineadas 1:1 con los perfiles Maven del backend (`local`, `dist`, `test`). No se deben usar nombres genéricos como `production` o `development`.

### Cambios aplicados

| Aspecto                         | Antes                                   | Después                                                        |
|---------------------------------|-----------------------------------------|----------------------------------------------------------------|
| Configuraciones Angular         | `production`, `development`             | `local`, `dist`, `test`                                        |
| Ficheros de entorno             | `environment.ts`, `environment.prod.ts` | `environment.ts`, `environment.dist.ts`, `environment.test.ts` |
| Default de `ng build`           | `production`                            | `dist`                                                         |
| Default de `ng serve`           | `development`                           | `local`                                                        |
| Campo `profile` en environments | No existía                              | Añadido, coincide con el perfil Maven                          |

Ficheros creados/actualizados:
- `src/environments/environment.ts` — perfil `local` (base, por defecto en `ng serve`)
- `src/environments/environment.dist.ts` — perfil `dist` (distribución)
- `src/environments/environment.test.ts` — perfil `test` (testing)
- Eliminado `src/environments/environment.prod.ts`
- Actualizado `angular.json` con las 3 configuraciones

Se documentó la regla de alineación en:
- `template-docs/04-development/coding-guidelines/angular.md` (sección "Entornos y Perfiles")
- `template-docs/04-development/environments.md` (documento completo de entornos)

---

## Corrección 5: Frontend no integrado en el build Maven

### Problema detectado

La tarea de scaffolding creó el proyecto Angular (`template-dashboard`) de forma completamente independiente, sin integración con el ciclo de vida Maven. Al compilar el WAR con `mvn package`, el frontend no se compilaba ni se incluía en el artefacto desplegable.

Esto significaba que el WAR del backend no podía servir la SPA, requiriendo un servidor separado para el frontend en todos los entornos.

### Convención esperada

El WAR generado por el módulo `webapp` debe incluir los recursos estáticos del frontend compilado, de forma que Spring Boot sirva la SPA directamente desde el mismo artefacto desplegable.

### Cambios aplicados

| Aspecto                           | Antes                 | Después                                                     |
|-----------------------------------|-----------------------|-------------------------------------------------------------|
| Frontend en WAR                   | No incluido           | Incluido en `WEB-INF/classes/static/`                       |
| Plugin Maven                      | No existía            | `frontend-maven-plugin` 1.15.1                              |
| Fases del build                   | Solo compilación Java | + install-node + npm-install + npm-build + copy-resources   |
| Propiedad `frontend.skip`         | No existía            | Permite saltar el build frontend con `-Dfrontend.skip=true` |
| Propiedad `angular.configuration` | No existía            | Se resuelve según perfil Maven activo                       |

Configuración añadida al POM de `webapp`:

```xml
<!-- frontend-maven-plugin: instala Node, ejecuta npm install y npm run build -->
<plugin>
    <groupId>com.github.eirslett</groupId>
    <artifactId>frontend-maven-plugin</artifactId>
    <configuration>
        <workingDirectory>${project.basedir}/../dashboard</workingDirectory>
        <skip>${frontend.skip}</skip>
    </configuration>
    <!-- ... executions: install-node-and-npm, npm-install, npm-build -->
</plugin>

<!-- maven-resources-plugin: copia el output de Angular a static/ -->
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-resources-plugin</artifactId>
    <!-- ... copy dist/dashboard/browser/ → classes/static/ -->
</plugin>
```

Propiedad `angular.configuration` añadida a cada perfil Maven del POM padre:

| Perfil Maven | `angular.configuration` |
|--------------|-------------------------|
| `local`      | `local`                 |
| `dist`       | `dist`                  |
| `test`       | `test`                  |

Comandos de compilación:

```bash
# Build completo (backend + frontend)
mvn clean package -Plocal -DskipTests

# Solo backend (sin frontend)
mvn clean package -Plocal -DskipTests -Dfrontend.skip=true
```

---

## Verificación

Tras aplicar todas las correcciones, se verificó que:

1. `cd template/template && mvn clean install -DskipTests` → **BUILD SUCCESS** (6 módulos)
2. `cd template/template-liquibase && mvn clean install -DskipTests` → **BUILD SUCCESS** (standalone) *(verificación histórica; las migraciones se integraron después en `domain`)*
3. La estructura de directorios coincide exactamente con la definida en `project-structure.md`
4. Los paquetes Java coinciden con la convención de `java-spring-boot.md`
5. Se identificaron y planificaron las tareas pendientes para `template-docker` y `template-dist` (Tasks 0.3 y 0.4)
6. `ng build --configuration=dist` → **BUILD SUCCESS** (configuraciones alineadas con perfiles Maven)
7. `mvn clean package -Plocal -DskipTests` → **BUILD SUCCESS** (WAR incluye frontend en `classes/static/`)
8. `mvn clean package -Plocal -DskipTests -Dfrontend.skip=true` → **BUILD SUCCESS** (solo backend)

---

## Lecciones aprendidas

1. **Estructura de directorios vs. artifactId**: En este proyecto, los nombres de directorio de los módulos Maven (`commons/`, `cluster/`, etc.) son diferentes al `artifactId` Maven (`template-commons`, `template-cluster`, etc.). Esto es una decisión deliberada para mantener los directorios limpios dentro del proyecto backend mientras se conservan `artifactId` descriptivos.

2. **Ubicación de las migraciones**: En el momento de estas correcciones, las migraciones vivían en un proyecto Maven independiente. Con la reorganización posterior se integraron en el módulo `domain`: los changelogs se empaquetan como recursos del JAR de `domain` y la ejecución manual (`mvn liquibase:update`) se realiza desde `domain` mediante el `liquibase-maven-plugin`, con sus dependencias acotadas al plugin para que `domain` siga siendo Java puro.

3. **GroupId alineado con paquete raíz**: El `groupId` de Maven debe coincidir con el paquete raíz Java definido en las coding guidelines (`org.myorganization.template`), no con el dominio del repositorio GitHub.

4. **Scaffolding completo**: El scaffolding inicial debe cubrir todos los componentes definidos en `project-structure.md`, no solo los de código fuente. Los proyectos de infraestructura (Docker, scripts de despliegue, configuración) también forman parte de la estructura base del workspace.

5. **Alineación de perfiles Maven ↔ Angular**: Las configuraciones de build de Angular deben usar los mismos nombres que los perfiles Maven (`local`, `dist`, `test`). No usar nombres genéricos (`production`, `development`). Si se añade un perfil Maven, se debe crear el fichero de entorno Angular correspondiente.

6. **Frontend integrado en el WAR**: El proyecto Angular debe poder compilarse desde Maven mediante `frontend-maven-plugin` y sus recursos estáticos deben incluirse en el WAR del módulo `webapp`. Esto permite desplegar un único artefacto que sirve tanto la API como la SPA. La propiedad `frontend.skip` permite a los desarrolladores backend compilar sin esperar al frontend.
