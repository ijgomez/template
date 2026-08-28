# Implementation Plan

## Overview

Plan de implementación para la reorganización de módulos descrita en `requirements.md` y `design.md`. Cubre dos movimientos estructurales independientes:

- **Parte A — Frontend:** mover `template/template-dashboard/` → `template/template/dashboard/` y renombrar el proyecto Angular a `dashboard`.
- **Parte B — Liquibase:** integrar los changelogs de `template/template-liquibase/` dentro de `template/template/domain/`, conservando la ejecución manual del plugin, y eliminar el proyecto independiente.

Las tareas se ejecutan en orden por fases (0 a 5). Cada tarea referencia los requisitos que cubre. Las tareas de verificación (`npm install`, `mvn`) las ejecuta el agente; `ng serve` lo arranca el usuario manualmente si desea validación visual. Todas las decisiones de diseño están cerradas; no hay tareas bloqueadas.

## Tasks

### Fase 0 — Preparación

- [ ] 0.1 Confirmar estado limpio de Git y crear rama de trabajo
  - `git status` para asegurar que no hay cambios sin commitear que puedan mezclarse
  - Crear rama (p. ej. `refactor/reorganize-modules`) siguiendo GitFlow
  - _Requisitos: 7_

- [ ] 0.2 (Opcional) Línea base del build
  - `mvn -pl webapp -am clean package -DskipTests` desde `template/template/` para confirmar que el estado actual compila antes de tocar nada
  - _Requisitos: 7.1_

### Fase 1 — Parte A: mover y renombrar el frontend a `dashboard`

- [ ] 1.1 Mover el directorio del frontend preservando historial
  - `git mv template/template-dashboard template/template/dashboard` desde la raíz del workspace
  - Verificar que los ficheros versionados se movieron y que las carpetas ignoradas (`node_modules`, `dist`, `.angular`, `node`) no bloquean el move
  - _Requisitos: 1.1, 1.2, 1.3_

- [ ] 1.2 Eliminar residuos del origen
  - Borrar por completo `template/template-dashboard/` si queda algún residuo de carpetas ignoradas tras el `git mv`
  - Confirmar que `template/template-dashboard/` ya no existe
  - _Requisitos: 1.1, 7.4_

- [ ] 1.3 Renombrar el proyecto Angular a `dashboard` en `package.json`
  - Cambiar `"name": "template-dashboard"` → `"name": "dashboard"`
  - _Requisitos: 1.4_

- [ ] 1.4 Renombrar el proyecto Angular en `angular.json`
  - Cambiar la clave del proyecto `"template-dashboard"` → `"dashboard"`
  - Actualizar todos los `buildTarget`: `template-dashboard:build:local|dist|test` → `dashboard:build:...` (en `serve` y `test`)
  - _Requisitos: 1.4, 1.5_

- [ ] 1.5 Revisar y ajustar referencias internas del frontend
  - `ngsw-config.json`: comprobar si referencia el nombre del proyecto o rutas de salida
  - `README.md` del frontend: actualizar menciones a `template-dashboard`
  - `.vscode/` del frontend (`tasks.json`/`launch.json`) si mencionan el nombre antiguo
  - `.iml` del dashboard si contiene el nombre antiguo
  - _Requisitos: 1.6, 6.2_

- [ ] 1.6 Actualizar `webapp/pom.xml` — `frontend-maven-plugin`
  - `workingDirectory`: `${project.basedir}/../../template-dashboard` → `${project.basedir}/../dashboard`
  - _Requisitos: 2.1_

- [ ] 1.7 Actualizar `webapp/pom.xml` — `maven-resources-plugin` (copy-frontend)
  - `directory`: `${project.basedir}/../../template-dashboard/dist/template-dashboard/browser` → `${project.basedir}/../dashboard/dist/dashboard/browser`
  - _Requisitos: 2.2_

- [ ] 1.8 Verificar el build aislado del frontend
  - Desde `template/template/dashboard/`: `npm install` y `npm run build`
  - Confirmar que la salida se genera en `dist/dashboard/browser`
  - Si la ruta difiere, fijar `outputPath` explícito en `angular.json` y volver a verificar
  - _Requisitos: 1.5, 2.3_

### Fase 2 — Parte B: integrar Liquibase en `domain`

- [ ] 2.1 Mover los changelogs a `domain` preservando historial
  - `git mv template/template-liquibase/src/main/resources/db template/template/domain/src/main/resources/db` (creando `domain/src/main/resources/` si no existe)
  - Conservar la estructura `db/changelog/{migrations,data}` y `db.changelog-master.xml`
  - _Requisitos: 3.1, 3.2_

- [ ] 2.2 Verificar rutas internas del changelog master
  - Confirmar que `db.changelog-master.xml` usa `relativeToChangelogFile="true"` en todos los `<include>` (no requiere edición al mover el árbol completo)
  - _Requisitos: 3.1, 3.3_

- [ ] 2.3 Eliminar la dependencia `template-liquibase` de `webapp/pom.xml`
  - Quitar el bloque `<dependency>` de `org.myorganization.template:template-liquibase`
  - Mantener `spring-boot-starter-liquibase` (runtime de migraciones)
  - _Requisitos: 4.1_

- [ ] 2.4 Portar `liquibase.properties` a `domain`
  - Mover `template/template-liquibase/src/main/resources/liquibase.properties` → `template/template/domain/src/main/resources/liquibase.properties` (con `git mv`)
  - _Requisitos: 4.3_

- [ ] 2.5 Añadir el `liquibase-maven-plugin` a `domain/pom.xml`
  - Añadir bloque `<build><plugins>` con `liquibase-maven-plugin` (`propertyFile=src/main/resources/liquibase.properties`)
  - Declarar `liquibase-core` y `postgresql` **dentro de `<plugin><dependencies>`**, NO como dependencias del módulo
  - Reutilizar propiedades heredadas del padre (`${liquibase.version}`, `${postgresql.version}`)
  - _Requisitos: 4.2, 4.5_

- [ ] 2.6 Verificar que `domain` sigue siendo Java puro en compile
  - `mvn dependency:tree -pl domain` desde `template/template/`: confirmar que `liquibase-core` y `postgresql` NO aparecen en el classpath de compilación (solo como deps del plugin)
  - _Requisitos: 4.2_

- [ ] 2.7 Eliminar el proyecto `template-liquibase`
  - Borrar `template/template-liquibase/` completo (pom.xml, .classpath, .project, .settings, .iml, target, src vaciado)
  - Confirmar que el POM padre no lo declaraba como `<module>` (no requiere edición del padre)
  - Confirmar que ninguna otra dependencia lo referencia
  - _Requisitos: 3.4, 7.4_

### Fase 3 — Referencias transversales

- [ ] 3.1 Actualizar el hook de Kiro
  - `.kiro/hooks/ux-designer-frontend.json`: actualizar el texto del prompt para referirse a `dashboard/` (ruta `template/template/dashboard/`) en lugar de `template-dashboard/`
  - _Requisitos: 6.1_

- [ ] 3.2 Actualizar `.kiro/steering/structure.md`
  - Actualizar la nota de changelogs: de `template-liquibase` a `domain`
  - Revisar cualquier mención a la ubicación del frontend
  - _Requisitos: 5.4_

- [ ] 3.3 Actualizar la documentación en `template-docs/**`
  - `01-introduction/project-structure.md`: diagrama de estructura + secciones "Frontend" y "Base de datos"
  - `04-development/build.md`: comandos `cd template-dashboard` → `cd template/dashboard`; rutas `dist/...`
  - `04-development/release.md`: rutas y procedimiento de versión del frontend
  - `04-development/configuration.md`: rutas `environment.ts`, comandos `cd`
  - `04-development/environments.md`: comando de migración Liquibase
  - `04-development/scaffolding-corrections.md`: diagramas y notas
  - `03-technical/backend/liquibase.md`: ubicación de changelogs
  - `04-development/coding-guidelines/liquibase.md`: ubicación de ficheros de migración
  - _Requisitos: 5.1, 5.2, 5.3_

- [ ] 3.4 Actualizar memorias de Serena
  - `.serena/memories/core.md`: árbol de estructura (`template-dashboard` → `template/dashboard`; `template-liquibase` → changelogs en `domain`)
  - `.serena/memories/conventions.md`: naming y nota "módulo separado template-liquibase"
  - `.serena/memories/task_completion.md`: comandos con `template-dashboard/` y `template-liquibase/`
  - _Requisitos: 5.5_

### Fase 4 — Verificación final

- [ ] 4.1 Build integrado backend + frontend
  - Desde `template/template/`: `mvn clean package`
  - Confirmar BUILD SUCCESS y frontend embebido en `webapp/target/classes/static/`
  - _Requisitos: 2.3, 2.4, 7.1, 7.2_

- [ ] 4.2 Tests de integración (Liquibase con Testcontainers)
  - Desde `template/template/`: `mvn verify -P test -pl webapp` (requiere Docker)
  - Confirmar que las migraciones se aplican desde el classpath sin errores
  - _Requisitos: 4.3, 7.3_

- [ ] 4.3 Comprobación de residuos y referencias rotas
  - Confirmar que no existen `template/template-dashboard/` ni `template/template-liquibase/`
  - `grep -r "template-dashboard\|template-liquibase"` en ficheros de build y config: solo deben quedar coincidencias intencionadas
  - _Requisitos: 7.4, 7.5_

### Fase 5 — Cierre

- [ ] 5.1 Commit
  - Un commit descriptivo (p. ej. `refactor: mover dashboard e integrar liquibase en domain`)
  - Solicitar confirmación del usuario antes de commitear
  - _Requisitos: —_

## Task Dependency Graph

Las Partes A (Fase 1) y B (Fase 2) son independientes entre sí y pueden ejecutarse en cualquier orden tras la Fase 0. La Fase 3 depende de que ambas partes hayan reubicado los directorios. La Fase 4 valida el resultado global y la Fase 5 cierra.

El siguiente bloque define las olas de ejecución (`waves`): cada ola agrupa tareas sin dependencias entre sí que pueden ejecutarse en paralelo; cada ola depende de las anteriores.

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": ["0.1"],
      "dependsOn": [],
      "description": "Preparación: rama de trabajo y estado limpio de Git"
    },
    {
      "wave": 2,
      "tasks": ["0.2"],
      "dependsOn": ["0.1"],
      "description": "Línea base del build (opcional)"
    },
    {
      "wave": 3,
      "tasks": ["1.1", "2.1", "2.3", "2.4"],
      "dependsOn": ["0.1"],
      "description": "Movimientos iniciales independientes: mover frontend, mover changelogs, limpiar dependencia en webapp, mover liquibase.properties"
    },
    {
      "wave": 4,
      "tasks": ["1.2", "1.3", "2.2", "2.5"],
      "dependsOn": ["1.1", "2.1", "2.4"],
      "description": "Limpieza de residuos del frontend, renombrado en package.json, verificación del master, alta del liquibase-maven-plugin"
    },
    {
      "wave": 5,
      "tasks": ["1.4", "1.6", "1.7", "2.6", "2.7"],
      "dependsOn": ["1.3", "2.5"],
      "description": "Renombrado en angular.json, rutas en webapp/pom.xml, verificación de classpath de domain, eliminación del proyecto template-liquibase"
    },
    {
      "wave": 6,
      "tasks": ["1.5", "1.8"],
      "dependsOn": ["1.4", "1.6", "1.7"],
      "description": "Referencias internas del frontend y verificación del build aislado (dist/dashboard/browser)"
    },
    {
      "wave": 7,
      "tasks": ["3.1", "3.2", "3.3", "3.4"],
      "dependsOn": ["1.8", "2.7"],
      "description": "Referencias transversales: hook, steering, documentación y memorias de Serena"
    },
    {
      "wave": 8,
      "tasks": ["4.1"],
      "dependsOn": ["3.1", "3.2", "3.3", "3.4"],
      "description": "Build integrado backend + frontend"
    },
    {
      "wave": 9,
      "tasks": ["4.2", "4.3"],
      "dependsOn": ["4.1"],
      "description": "Tests de integración con Testcontainers y comprobación de residuos/referencias rotas"
    },
    {
      "wave": 10,
      "tasks": ["5.1"],
      "dependsOn": ["4.2", "4.3"],
      "description": "Commit final (requiere confirmación del usuario)"
    }
  ]
}
```

Representación visual equivalente:

```
0.1 ─┬─▶ 0.2 (opcional)
     │
     ├─▶ [Parte A] 1.1 ─▶ 1.2 ─▶ 1.3 ─▶ 1.4 ─▶ 1.5
     │                                     │
     │                    1.6 ─▶ 1.7 ──────┤
     │                                     ▼
     │                                    1.8
     │
     └─▶ [Parte B] 2.1 ─▶ 2.2
                    2.3
                    2.4 ─▶ 2.5 ─▶ 2.6
                    (2.1, 2.4 completadas) ─▶ 2.7

Convergencia:
  (1.8 + 2.7) ─▶ 3.1 ─▶ 3.2 ─▶ 3.3 ─▶ 3.4 ─▶ 4.1 ─▶ 4.2 ─▶ 4.3 ─▶ 5.1
```

Notas del grafo:
- **1.1 → 1.2 → 1.3 → 1.4:** el renombrado interno se hace después de mover el directorio.
- **1.6, 1.7 (webapp/pom.xml)** pueden hacerse en paralelo al renombrado del frontend, pero **1.8** (verificación del build aislado) requiere que el renombrado (1.3, 1.4) esté completo.
- **2.1 (mover changelogs), 2.3 (limpiar webapp), 2.4 (mover properties)** son independientes entre sí; **2.5** depende de 2.4 (necesita el `liquibase.properties` en destino); **2.6** depende de 2.5.
- **2.7 (eliminar proyecto)** debe ejecutarse después de 2.1 y 2.4 (una vez extraído todo lo aprovechable del proyecto).
- **Fase 3** (referencias transversales) se ejecuta cuando los directorios ya están en su ubicación final.
- **Fase 4** valida todo el conjunto; **4.2** requiere Docker.

## Notes

- Todas las decisiones de diseño están cerradas; no hay tareas bloqueadas.
- `ng serve` no lo ejecuta el agente (proceso de larga duración); el usuario lo arranca si quiere validación visual del frontend.
- La tarea 4.2 requiere Docker en la máquina (Testcontainers levanta un contenedor PostgreSQL).
- Todos los movimientos de ficheros usan `git mv` para preservar el historial.
- El commit final (5.1) requiere confirmación explícita del usuario antes de ejecutarse.
