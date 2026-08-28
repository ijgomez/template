# Design — Reorganización de módulos

## Overview

La reorganización consta de dos movimientos estructurales independientes que se pueden ejecutar y verificar por separado, aunque comparten pasos de verificación final:

- **Parte A — Frontend:** mover `template/template-dashboard/` → `template/template/dashboard/` y renombrar el proyecto Angular a `dashboard`.
- **Parte B — Liquibase:** integrar los changelogs de `template/template-liquibase/` dentro de `template/template/domain/`, conservando la ejecución manual del plugin, y eliminar el proyecto independiente.

Ambos cambios son de **reubicación y reconfiguración**, sin tocar la lógica de negocio, entidades ni changesets. El criterio de éxito global es: `mvn clean install` compila todos los módulos, el WAR embebe el frontend, y los tests de integración aplican las migraciones correctamente.

### Decisiones confirmadas

1. **Ejecución manual de Liquibase:** se conserva, con el `liquibase-maven-plugin` y `liquibase.properties` en `domain`, y las dependencias del plugin acotadas al bloque `<plugin><dependencies>` (ver Components and Interfaces).
2. **Nombre interno del proyecto Angular:** pasa a `dashboard` (afecta `dist/dashboard/browser` y el `copy-resources` del webapp).
3. **Memorias de Serena:** se actualizan dentro del alcance de este spec (`.serena/memories/{core,conventions,task_completion}.md`).

## Architecture

### Estructura actual

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

### Parte A — Movimiento y renombrado del frontend

Se mueve el directorio completo preservando historial con `git mv`. Solo se mueven ficheros versionados; las carpetas generadas (`node_modules`, `dist`, `.angular`, `node`) están en `.gitignore` y no se arrastran: se regeneran con `npm install` y el build.

```
template/template-dashboard/   →   template/template/dashboard/
```

Ficheros versionados a mover (raíz del proyecto Angular): `.editorconfig`, `.gitignore`, `.prettierrc`, `README.md`, `angular.json`, `ngsw-config.json`, `package.json`, `package-lock.json`, `tsconfig.app.json`, `tsconfig.json`, `tsconfig.spec.json`, `.vscode/`, `public/`, `src/`.

Como `git mv` de un directorio no arrastra ficheros ignorados, tras el `git mv` puede quedar en origen residuo de carpetas ignoradas (`node_modules`, etc.); se elimina el directorio origen `template/template-dashboard/` por completo al final.

Flujo del build del frontend (sin cambios funcionales, solo cambian las rutas relativas):

```
mvn package (webapp)
  └─ frontend-maven-plugin (workingDirectory = ../dashboard)
       ├─ install-node-and-npm (v22.22.3)
       ├─ npm install
       └─ npm run build -- --configuration=dist   → genera ../dashboard/dist/dashboard/browser
  └─ maven-resources-plugin (copy-frontend)
       └─ copia ../dashboard/dist/dashboard/browser → webapp/target/classes/static/
  └─ WAR con static/ embebido
```

### Parte B — Integración de Liquibase en `domain`

Se traslada el árbol completo de changelogs preservando historial:

```
template/template-liquibase/src/main/resources/db/changelog/**
   →
template/template/domain/src/main/resources/db/changelog/**
```

**Resolución en el classpath (sin cambios en `application.yml`).** La app Spring localiza el changelog con `spring.liquibase.change-log: classpath:db/changelog/db.changelog-master.xml`. Es una ruta de **classpath**, no física. Hoy funciona porque `webapp` depende del JAR `template-liquibase`; tras el cambio, esos mismos recursos los aporta el JAR de `domain`, que ya está en el classpath del `webapp` por dependencia transitiva:

```
webapp → core → domain   (domain empaqueta db/changelog/** como recurso)
```

Por tanto, `application.yml` **no cambia**.

**Eliminación del proyecto `template-liquibase`.** Una vez migrados los recursos y el `liquibase.properties`:
- Eliminar el directorio `template/template-liquibase/` completo (`pom.xml`, `.classpath`, `.project`, `.settings/`, `.iml`, `target/`).
- El POM padre **no** lo declaraba como módulo (verificado: no está en `<modules>`), por lo que no hay que tocar el `<modules>` del padre.
- Ninguna otra dependencia Maven referencia `template-liquibase` salvo `webapp` (verificado), que se limpia.

## Components and Interfaces

### `webapp/pom.xml` — integración del frontend

Dos rutas relativas cambian de dos niveles (`../../`, cuando el dashboard estaba en la raíz) a un nivel (`../`, ahora hermano dentro de `template/template/`), y el segmento `template-dashboard` pasa a `dashboard`:

**frontend-maven-plugin:**
```xml
<workingDirectory>${project.basedir}/../../template-dashboard</workingDirectory>
```
→
```xml
<workingDirectory>${project.basedir}/../dashboard</workingDirectory>
```

**maven-resources-plugin (copy-frontend):**
```xml
<directory>${project.basedir}/../../template-dashboard/dist/template-dashboard/browser</directory>
```
→
```xml
<directory>${project.basedir}/../dashboard/dist/dashboard/browser</directory>
```

Nótese el doble cambio en la segunda: la ubicación (`../dashboard`) **y** el nombre del subdirectorio de salida (`dist/dashboard/browser`). El resto de la configuración del `frontend-maven-plugin` (versión de Node, `npm install`, `npm run build -- --configuration=${angular.configuration}`) no cambia.

### `webapp/pom.xml` — dependencia de Liquibase

Se elimina la dependencia directa sobre `template-liquibase` (el artefacto desaparece):

```xml
<!-- ELIMINAR -->
<dependency>
    <groupId>org.myorganization.template</groupId>
    <artifactId>template-liquibase</artifactId>
    <version>${project.version}</version>
</dependency>
```

La dependencia `spring-boot-starter-liquibase` (runtime de Liquibase que ejecuta las migraciones al arrancar) **se mantiene**. Solo desaparece el JAR que aportaba los ficheros de changelog, porque ahora los aporta `domain`.

### `angular.json` y `package.json` — renombrado del proyecto Angular

| Fichero | Cambio |
|---------|--------|
| `package.json` | `"name": "template-dashboard"` → `"name": "dashboard"` |
| `angular.json` | Clave del proyecto `"template-dashboard"` → `"dashboard"` |
| `angular.json` | `buildTarget`s: `template-dashboard:build:local` → `dashboard:build:local` (y variantes `dist`, `test`, y el `serve`/`test` que referencian `template-dashboard:build:...`) |

**Ruta de salida del build.** Angular deriva la carpeta de salida del nombre del proyecto: `dist/<project-name>/browser`. Al renombrar el proyecto a `dashboard`, la salida pasa automáticamente a `dist/dashboard/browser`. No hay una opción `outputPath` explícita en el `angular.json` actual (usa el builder `@angular/build:application` con salida por defecto derivada del nombre), por lo que el cambio de nombre es suficiente. Se verificará empíricamente y, si el builder generase otra ruta, se añadirá `outputPath` explícito.

Referencias internas adicionales del frontend a revisar: `ngsw-config.json` (nombre/rutas), `README.md` (menciones a `template-dashboard`), `.vscode/` (`tasks.json`/`launch.json`).

### `domain/pom.xml` — plugin Liquibase con dependencias acotadas

Se conserva la ejecución manual (`mvn liquibase:update`) **desde `domain`**. Dos aspectos:

**1. Recursos (automático):** los ficheros XML de Liquibase son recursos de `src/main/resources/db/changelog/**` y se empaquetan en el JAR de `domain` sin configuración adicional.

**2. `liquibase-maven-plugin` con dependencias acotadas:** el plugin se añade al `build` de `domain`, pero `liquibase-core` y el driver `postgresql` se declaran **dentro del propio bloque `<plugin><dependencies>`**, no como dependencias del módulo. Así el plugin dispone de lo que necesita en build time, pero el classpath de compilación de `domain` **no** cambia ni se propagan dependencias transitivas: `domain` sigue siendo Java puro (salvo JPA) para el resto de módulos.

```xml
<build>
  <plugins>
    <plugin>
      <groupId>org.liquibase</groupId>
      <artifactId>liquibase-maven-plugin</artifactId>
      <version>${liquibase.version}</version>
      <configuration>
        <propertyFile>src/main/resources/liquibase.properties</propertyFile>
      </configuration>
      <dependencies>
        <!-- Dependencias SOLO del plugin, no del módulo -->
        <dependency>
          <groupId>org.liquibase</groupId>
          <artifactId>liquibase-core</artifactId>
          <version>${liquibase.version}</version>
        </dependency>
        <dependency>
          <groupId>org.postgresql</groupId>
          <artifactId>postgresql</artifactId>
          <version>${postgresql.version}</version>
        </dependency>
      </dependencies>
    </plugin>
  </plugins>
</build>
```

Notas:
- `${liquibase.version}` y `${postgresql.version}` ya están definidas como propiedades en el POM padre (`4.31.1` y `42.7.5`), por lo que `domain` las hereda.
- El `liquibase-maven-plugin` también está en el `<pluginManagement>` del padre (versión gestionada), lo que refuerza la coherencia.

### Hook de Kiro

`.kiro/hooks/ux-designer-frontend.json` usa la subcadena `template-dashboard/` en su prompt para decidir el ámbito. Como el nuevo directorio se llama `dashboard/` y está en `template/template/dashboard/`, se actualiza el texto del prompt para referirse a `dashboard/`. El `matcher` del hook (`fs_write|str_replace|fs_append`) filtra por nombre de herramienta, no por ruta, así que no cambia.

### Documentación, steering y memorias

- **`template-docs/**`:** `01-introduction/project-structure.md`, `04-development/build.md`, `04-development/release.md`, `04-development/configuration.md`, `04-development/environments.md`, `04-development/scaffolding-corrections.md`, `03-technical/backend/liquibase.md`, `04-development/coding-guidelines/liquibase.md`.
- **`.kiro/steering/structure.md`:** la nota "changelogs se mantienen dentro de `template-liquibase`" pasa a `domain`; revisar mención a la ubicación del frontend.
- **`.serena/memories/*.md`:** `core.md` (árbol de estructura), `conventions.md` (naming y "módulo separado template-liquibase"), `task_completion.md` (comandos con `template-dashboard/` y `template-liquibase/`).
- **Ficheros de IDE (`.iml`, `.classpath`, `.project`, `.settings/`):** se mueven/eliminan con sus directorios; Eclipse/IntelliJ los regeneran al reimportar. Solo se editan si contienen rutas rotas.

## Data Models

No se modifica el modelo de datos ni las entidades JPA ni los changesets: solo se **reubican** los ficheros de Liquibase. El modelo se documenta aquí para dejar constancia de la relación entre las entidades (Java) y los changelogs (XML) que ahora conviven en `domain`.

### Estructura de changelogs (se conserva intacta)

```
domain/src/main/resources/db/
└── changelog/
    ├── db.changelog-master.xml
    ├── migrations/
    │   ├── v1.0.0/   (create-*-table.xml, 21 tablas)
    │   └── v2.0.0/   (20260817-users-nullable-optional-fields.xml)
    └── data/
        └── v1.0.0/   (seed-*.xml)
```

### Invariante clave: rutas relativas del master

`db.changelog-master.xml` referencia los ficheros con `relativeToChangelogFile="true"`. Las rutas (`migrations/v1.0.0/...`, `data/v1.0.0/...`) son relativas al propio master. Al mover el árbol completo como una unidad, esas rutas siguen siendo válidas **sin edición**.

### Correspondencia entidad ↔ changelog (objetivo del cambio)

Las entidades JPA viven en `domain/src/main/java/org/myorganization/template/domain/entity/` (`Action`, `Profile`, `Report`, `User`, `Parameter`, `AuditLog`, `Interface`, `InterfaceLog`, `ClusterTask`, `ClusterNode`, `ClusterBlock`, `ClusterJob`, `RefreshToken`, etc.). Tras el cambio, sus tablas correspondientes (`migrations/v1.0.0/*-create-*-table.xml`) residen en el mismo módulo, cumpliendo el objetivo de centralizar código de modelo y esquema.

### `liquibase.properties`

Se traslada de `template-liquibase/src/main/resources/` a `domain/src/main/resources/`. Contenido sin cambios (conexión a la BD local para ejecución manual):

```properties
changeLogFile=db/changelog/db.changelog-master.xml
driver=org.postgresql.Driver
url=jdbc:postgresql://localhost:5432/template
username=template
password=template
```

Consideración de seguridad: contiene credenciales de la BD **local** de desarrollo (usuario/clave `template`), igual que hoy. No cambia la postura de seguridad. Los entornos reales usan los `application-*.yml` del `webapp` con variables de entorno.

## Correctness Properties

Propiedades que deben mantenerse ciertas tras la reorganización:

### Property 1: Directorios finales correctos

Existe `template/template/dashboard/` y `template/template/domain/src/main/resources/db/changelog/`; no existen `template/template-dashboard/` ni `template/template-liquibase/`.

**Validates: Requirements 1.1, 3.1, 3.4, 7.4**

### Property 2: Historial de Git preservado

Todos los movimientos se realizan con `git mv`, de modo que los ficheros conservan su historial de Git.

**Validates: Requirements 1.2, 3.2**

### Property 3: El build del frontend produce los estáticos en la ubicación esperada

El build Angular genera `dist/dashboard/browser` y el `copy-frontend` copia esos estáticos a `webapp/target/classes/static/`.

**Validates: Requirements 1.5, 2.1, 2.2, 2.3**

### Property 4: WAR autocontenido

El WAR resultante incluye los recursos estáticos del frontend.

**Validates: Requirements 2.4, 7.2**

### Property 5: Resolución del changelog sin cambios de configuración

`classpath:db/changelog/db.changelog-master.xml` sigue resolviéndose en runtime (vía `domain` en el classpath del `webapp`), sin cambios en `application.yml`.

**Validates: Requirements 3.3, 4.1**

### Property 6: `domain` sigue siendo Java puro

`liquibase-core` y `postgresql` NO aparecen en el classpath de compilación de `domain` (solo como dependencias del plugin). Verificable con `mvn dependency:tree -pl domain`.

**Validates: Requirements 4.2**

### Property 7: Migraciones aplicadas correctamente

Al arrancar `webapp` y en los tests de integración (Testcontainers), Liquibase aplica el changelog master sin errores. La ejecución manual `mvn liquibase:update` desde `domain` también aplica las migraciones usando el `liquibase.properties` local.

**Validates: Requirements 4.4, 4.5, 7.3**

### Property 8: Sin referencias rotas

Ninguna referencia por ruta o nombre a `template-dashboard`/`template-liquibase` queda en ficheros de build o configuración (salvo histórico documental intencionado). Documentación, steering, memorias de Serena y el hook quedan actualizados.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 7.1, 7.5**

## Error Handling

Riesgos identificados y su mitigación:

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| La ruta de salida del build Angular no sea `dist/dashboard/browser` tras el rename | El `copy-frontend` no encuentra los estáticos → WAR sin frontend | Verificar empíricamente el build aislado; si difiere, fijar `outputPath` explícito en `angular.json` |
| Quedar residuo de `node_modules`/`dist` en el origen tras `git mv` | Directorio huérfano | Eliminar `template/template-dashboard/` completo tras el move |
| Dependencias del plugin Liquibase filtrándose al classpath de `domain` | `domain` deja de ser Java puro | Declarar `liquibase-core`/`postgresql` dentro de `<plugin><dependencies>`; verificar con `mvn dependency:tree -pl domain` |
| Ruta de changelog rota tras mover recursos | Liquibase no arranca | El master usa `relativeToChangelogFile="true"`; se mueve el árbol completo como unidad y se verifica en tests de integración |
| Referencias en cachés de Serena (`.serena/cache/*.pkl`) | Ninguno en build | Se regeneran; no se editan a mano |
| Referencias rotas en documentación no detectadas | Instrucciones obsoletas | Búsqueda global `grep` como paso de verificación |

## Testing Strategy

Orden recomendado de verificación tras implementar:

1. **Frontend build aislado:** desde `template/template/dashboard/`, `npm install` y `npm run build` → debe generar `dist/dashboard/browser`.
2. **`domain` sigue Java puro:** `mvn dependency:tree -pl domain` desde `template/template/` → `liquibase-core` y `postgresql` no aparecen en compile.
3. **Build backend + frontend integrado:** desde `template/template/`, `mvn clean package` → BUILD SUCCESS, frontend embebido en `webapp/target/classes/static/`, WAR con estáticos.
4. **Tests de integración:** desde `template/template/`, `mvn verify -P test -pl webapp` (requiere Docker/Testcontainers) → Liquibase aplica el changelog master desde el classpath sin errores.
5. **Ejecución manual de Liquibase:** `mvn liquibase:update` desde `domain` (contra BD local) → aplica migraciones usando `liquibase.properties`.
6. **Comprobación de residuos:** no existe `template/template-dashboard/` ni `template/template-liquibase/`.
7. **Búsqueda de referencias rotas:** `grep -r "template-dashboard\|template-liquibase"` en ficheros de build y config → solo coincidencias intencionadas.

Notas:
- `ng serve` es un proceso de larga duración: lo arranca el usuario manualmente si quiere validación visual.
- Los comandos `npm install` y `mvn` los puede ejecutar el agente.
- La verificación de integración (paso 4) requiere Docker (Testcontainers levanta un contenedor PostgreSQL).
