# Requirements Document

## Introduction

Este spec cubre dos reorganizaciones estructurales del proyecto, sin cambios funcionales en el comportamiento de la aplicación:

1. **Mover el frontend Angular** desde `template/template-dashboard/` (raíz del workspace) a `template/template/dashboard/` (dentro del proyecto backend, como hermano de `cluster`, `core`, `webapp`), renombrándolo completamente a `dashboard` (sin el prefijo `template-`), incluyendo el nombre interno del proyecto Angular.

2. **Integrar el módulo `template-liquibase`** dentro del módulo `domain`, de modo que las clases Java de las entidades JPA y los ficheros XML con los changesets de Liquibase convivan en el mismo módulo.

El objetivo es simplificar la estructura del repositorio, agrupar artefactos relacionados y reducir la cantidad de proyectos independientes en la raíz del workspace. Al terminar, el proyecto debe seguir compilando (`mvn clean install`) y empaquetando el WAR con el frontend embebido, y la documentación debe reflejar la nueva estructura.

### Estructura actual (relevante)

```
template/                              ← raíz del workspace
├── template/                          ← proyecto backend (POM padre)
│   ├── commons/
│   ├── cluster/
│   ├── domain/                        ← entidades JPA, DTOs (Java puro)
│   ├── core/
│   ├── ws/
│   └── webapp/                        ← WAR; depende de template-liquibase (JAR)
├── template-dashboard/                ← frontend Angular (proyecto independiente)
└── template-liquibase/                ← changelogs Liquibase (proyecto Maven independiente)
```

### Estructura objetivo

```
template/                              ← raíz del workspace
└── template/                          ← proyecto backend (POM padre)
    ├── commons/
    ├── cluster/
    ├── domain/                        ← entidades JPA + changelogs Liquibase (db/changelog/**)
    ├── core/
    ├── ws/
    ├── webapp/                        ← WAR
    └── dashboard/                     ← frontend Angular
```

### Datos de partida verificados

- `webapp/pom.xml` referencia el frontend por ruta relativa `${project.basedir}/../../template-dashboard` (frontend-maven-plugin y maven-resources-plugin).
- `webapp/pom.xml` declara dependencia sobre el artefacto `template-liquibase` (`org.myorganization.template:template-liquibase:${project.version}`).
- El POM padre (`template/pom.xml`) declara los módulos: `commons`, `cluster`, `domain`, `core`, `ws`, `webapp`. `template-liquibase` **no** es submódulo del padre; es un proyecto Maven independiente.
- La app Spring localiza el changelog vía `spring.liquibase.change-log: classpath:db/changelog/db.changelog-master.xml` (ruta de classpath, no física).
- Los changesets viven en `template-liquibase/src/main/resources/db/changelog/` (migrations + data, XML).
- `domain` es un módulo Java puro (sin Spring), con dependencias `jakarta.persistence-api` y `jakarta.validation-api`.
- El nombre interno del proyecto Angular es `template-dashboard` (en `angular.json`, `package.json`) y la ruta de salida es `dist/template-dashboard/browser`.

---

## Requirements

### Requirement 1: Mover y renombrar el frontend a `dashboard`

**User Story:** Como desarrollador, quiero que el frontend Angular esté ubicado dentro del proyecto backend con el nombre `dashboard`, para mantener una estructura de directorios homogénea y limpia junto al resto de módulos.

#### Acceptance Criteria

1. CUANDO se complete el movimiento, ENTONCES el directorio del frontend DEBE estar en `template/template/dashboard/` y NO DEBE existir `template/template-dashboard/`.
2. EL movimiento DEBE preservar el historial de Git (usando `git mv` sobre los ficheros versionados).
3. LAS carpetas generadas (`node_modules`, `dist`, `.angular`, `node`) NO DEBEN versionarse ni arrastrarse al destino; se regeneran con `npm install` / build.
4. EL nombre interno del proyecto Angular DEBE cambiar de `template-dashboard` a `dashboard` en `package.json` (campo `name`) y en `angular.json` (clave del proyecto y todos los `buildTarget`).
5. LA ruta de salida del build (`dist/template-dashboard/browser`) DEBE pasar a `dist/dashboard/browser` de forma coherente con el nuevo nombre del proyecto.
6. TODA referencia interna del proyecto Angular al nombre antiguo DEBE quedar actualizada (por ejemplo `ngsw-config.json`, `README.md` del frontend si aplica).

### Requirement 2: Actualizar la integración Maven del frontend en `webapp`

**User Story:** Como desarrollador, quiero que el build Maven siga compilando y embebiendo el frontend tras el movimiento, para que `mvn clean package` genere un WAR autocontenido.

#### Acceptance Criteria

1. EN `webapp/pom.xml`, la `workingDirectory` del `frontend-maven-plugin` DEBE apuntar a la nueva ubicación relativa `${project.basedir}/../dashboard`.
2. EN `webapp/pom.xml`, el `directory` del `maven-resources-plugin` (copy-frontend) DEBE apuntar a `${project.basedir}/../dashboard/dist/dashboard/browser`.
3. CUANDO se ejecute `mvn clean package` desde `template/template/`, ENTONCES el frontend DEBE compilarse y sus ficheros estáticos DEBEN copiarse a `webapp/target/classes/static/`.
4. EL WAR resultante DEBE contener los recursos estáticos del frontend.

### Requirement 3: Integrar los changelogs de Liquibase dentro de `domain`

**User Story:** Como desarrollador, quiero que los changesets XML de Liquibase estén en el mismo módulo que las entidades JPA (`domain`), para que el modelo de datos (código + esquema) esté centralizado.

#### Acceptance Criteria

1. LOS ficheros de `template-liquibase/src/main/resources/db/changelog/**` DEBEN trasladarse a `domain/src/main/resources/db/changelog/**`, conservando la estructura interna (`migrations/`, `data/`, `db.changelog-master.xml`).
2. EL traslado DEBE preservar el historial de Git (usando `git mv`).
3. LA ruta de classpath `classpath:db/changelog/db.changelog-master.xml` DEBE seguir siendo válida sin cambios en `application.yml`, dado que los recursos quedan en el classpath a través de la dependencia sobre `domain`.
4. EL proyecto Maven independiente `template-liquibase` DEBE eliminarse de la raíz del workspace una vez migrados sus contenidos.
5. LA capacidad de ejecutar migraciones vía Maven (`liquibase-maven-plugin`) DEBE conservarse; se decidirá en diseño dónde reside el plugin y su `liquibase.properties`.

### Requirement 4: Ajustar dependencias y configuración Maven tras la integración de Liquibase

**User Story:** Como desarrollador, quiero que las dependencias Maven queden coherentes tras integrar Liquibase en `domain`, para que el WAR siga aplicando las migraciones al arrancar.

#### Acceptance Criteria

1. LA dependencia `template-liquibase` en `webapp/pom.xml` DEBE eliminarse, ya que sus recursos llegan ahora vía `domain` (transitivamente a través de `core`).
2. `domain/pom.xml` DEBE incorporar el `liquibase-maven-plugin` para permitir la ejecución manual de migraciones desde `domain`, PERO las dependencias que requiere el plugin (`liquibase-core` y el driver `postgresql`) DEBEN declararse dentro del propio bloque `<plugin><dependencies>` — NO como dependencias del módulo — para no contaminar el classpath de compilación de `domain` ni propagarse transitivamente. De este modo `domain` sigue siendo un módulo Java puro (salvo JPA) en tiempo de compilación.
3. EL fichero `liquibase.properties` (con la configuración de conexión para la ejecución manual) DEBE trasladarse a `domain/src/main/resources/`.
4. CUANDO el `webapp` arranque (o en los tests de integración con Testcontainers), ENTONCES Liquibase DEBE localizar y aplicar el changelog master desde el classpath sin errores.
5. CUANDO se ejecute `mvn liquibase:update` (u otros goals) desde `domain`, ENTONCES DEBE aplicar las migraciones usando el `liquibase.properties` local.

### Requirement 5: Actualizar la documentación del proyecto

**User Story:** Como miembro del equipo, quiero que la documentación refleje la nueva estructura, para no seguir instrucciones obsoletas.

#### Acceptance Criteria

1. TODA referencia a `template-dashboard` (rutas, comandos `cd`, diagramas de estructura, rutas de artefactos) en `template-docs/**` DEBE actualizarse a la nueva ubicación `template/dashboard` y nombre `dashboard`.
2. TODA referencia a `template-liquibase` como proyecto/módulo independiente en `template-docs/**` DEBE actualizarse para reflejar que los changelogs viven ahora en `domain`.
3. LOS ficheros afectados incluyen al menos: `01-introduction/project-structure.md`, `04-development/build.md`, `04-development/release.md`, `04-development/configuration.md`, `04-development/environments.md`, `04-development/scaffolding-corrections.md`, `03-technical/backend/liquibase.md`, `04-development/coding-guidelines/liquibase.md`.
4. LOS ficheros de steering (`.kiro/steering/structure.md`) que mencionen las ubicaciones antiguas DEBEN actualizarse.
5. LAS memorias de Serena (`.serena/memories/*.md`) que mencionen las ubicaciones o convenciones antiguas (`template-dashboard`, `template-liquibase` como módulo independiente) DEBEN actualizarse a la nueva estructura. Esto está DENTRO del alcance de este spec.

### Requirement 6: Actualizar el hook de Kiro y otras referencias por nombre

**User Story:** Como desarrollador, quiero que las automatizaciones sigan funcionando tras el renombrado, para no perder los controles de calidad configurados.

#### Acceptance Criteria

1. EL hook `.kiro/hooks/ux-designer-frontend.json`, que filtra por la ruta `template-dashboard/`, DEBE actualizarse para reconocer la nueva ruta `dashboard/` (dentro de `template/template/`).
2. CUALQUIER otra referencia por nombre a `template-dashboard` o `template-liquibase` en configuración del repositorio (`.iml`, `.classpath`, `.project`, ficheros de IDE) DEBE identificarse y tratarse (actualizar o regenerar) para no dejar referencias rotas.

### Requirement 7: Verificación de que el proyecto sigue operativo

**User Story:** Como desarrollador, quiero verificar que tras la reorganización todo compila y funciona, para tener confianza en el cambio.

#### Acceptance Criteria

1. CUANDO se ejecute `mvn clean install` desde `template/template/`, ENTONCES el build DEBE terminar con éxito para todos los módulos.
2. CUANDO se ejecute el build con el perfil de distribución, ENTONCES el frontend DEBE compilarse desde `template/dashboard` y embeberse en el WAR.
3. LOS tests de integración del `webapp` (que aplican migraciones Liquibase con Testcontainers) DEBEN pasar.
4. NO DEBEN quedar directorios huérfanos (`template-dashboard/`, `template-liquibase/`) en la raíz del workspace.
5. NO DEBEN quedar referencias rotas a las rutas o nombres antiguos en ficheros de build ni configuración.

---

## Fuera de alcance

- Cambios funcionales en el comportamiento del frontend o backend.
- Cambios en el modelo de datos, entidades o changesets (solo se trasladan, no se modifican).
- Renombrado de otros módulos o artefactos Maven (`template-commons`, `template-core`, etc.).
- Cambios en el `groupId`/`artifactId` de `domain` (se mantiene `template-domain`).

## Decisiones cerradas

1. **Ejecución manual de Liquibase:** SE CONSERVA. El `liquibase-maven-plugin` y el `liquibase.properties` se ubican en `domain`, de modo que las entidades JPA y los changesets conviven y se puede ejecutar `mvn liquibase:update` desde `domain`.
2. **Dependencias del plugin en `domain`:** `liquibase-core` y `postgresql` se declaran dentro del bloque `<plugin><dependencies>` del `liquibase-maven-plugin`, NO como dependencias del módulo, para no romper la regla de "domain es Java puro salvo JPA" en tiempo de compilación.
3. **Nombre interno del proyecto Angular:** pasa a `dashboard` (afecta `dist/dashboard/browser` y el `copy-resources` del webapp).
4. **Memorias de Serena:** SE ACTUALIZAN dentro del alcance de este spec, junto con `template-docs` y el steering.

## Glossary

- **`dashboard`**: nuevo nombre del proyecto frontend Angular (antes `template-dashboard`), ubicado en `template/template/dashboard/`.
- **`domain`**: módulo Maven del backend que contiene las entidades JPA y, tras este cambio, los changelogs de Liquibase. Debe permanecer como módulo Java puro (salvo JPA) en tiempo de compilación.
- **`webapp`**: módulo Maven que empaqueta el WAR; compila e integra el frontend y arranca la aplicación Spring Boot.
- **Changelog / changeset**: ficheros XML de Liquibase que definen y versionan el esquema de base de datos. El changelog maestro es `db.changelog-master.xml`.
- **`db.changelog-master.xml`**: fichero raíz de Liquibase que incluye el resto de changesets mediante rutas relativas (`relativeToChangelogFile="true"`).
- **`frontend-maven-plugin`**: plugin Maven (`com.github.eirslett`) que instala Node/npm y compila el frontend Angular durante el build del `webapp`.
- **`liquibase-maven-plugin`**: plugin Maven que permite ejecutar goals de Liquibase (`liquibase:update`, etc.) manualmente; se ubicará en `domain`.
- **`liquibase.properties`**: fichero de configuración de conexión a la BD local usado por la ejecución manual del plugin Liquibase.
- **Classpath**: conjunto de recursos disponibles en tiempo de ejecución/compilación; los changelogs se localizan vía `classpath:db/changelog/db.changelog-master.xml`.
- **`git mv`**: comando de Git que mueve/renombra ficheros preservando su historial.
- **Testcontainers**: librería que levanta un contenedor PostgreSQL para los tests de integración del `webapp`.
- **`template-dashboard` / `template-liquibase`**: nombres antiguos del frontend y del proyecto de migraciones, respectivamente; ambos desaparecen tras la reorganización.
