# Correcciones post-scaffolding

## Introducción

Tras la ejecución de la tarea inicial de scaffolding del proyecto (Task 0: Project structure scaffolding), se identificaron dos desviaciones respecto a las convenciones definidas en la documentación del proyecto. Ambas fueron corregidas antes de continuar con la implementación.

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
│   ├── domain/
│   ├── core/
│   └── webapp/
├── template-dashboard/     ← frontend Angular (proyecto independiente)
├── template-liquibase/     ← migraciones de BD (proyecto independiente)
└── template-docs/          ← documentación
```

### Cambios aplicados

| Aspecto | Antes | Después |
|---------|-------|---------|
| Ubicación del POM padre | `template/pom.xml` (raíz) | `template/template/pom.xml` |
| Nombres de módulos | `template-commons/`, `template-cluster/`, etc. | `commons/`, `cluster/`, `domain/`, `core/`, `webapp/` |
| Ubicación de módulos | Raíz del workspace | Dentro de `template/template/` |
| `template-liquibase` | Submódulo Maven del POM padre | Proyecto independiente en la raíz |
| Declaración de módulos en POM | `<module>template-commons</module>` | `<module>commons</module>` |

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

| Módulo Maven | Paquete base |
|--------------|--------------|
| `commons` | `org.myorganization.template.commons` |
| `cluster` | `org.myorganization.template.cluster` |
| `domain` | `org.myorganization.template.domain` |
| `core` | `org.myorganization.template.core` |
| `webapp` | `org.myorganization.template.web` |

### Cambios aplicados

| Aspecto | Antes | Después |
|---------|-------|---------|
| `groupId` en POMs | `com.ijgomez.template` | `org.myorganization.template` |
| Paquete Java | `com.ijgomez.template.*` | `org.myorganization.template.*` |
| Directorios de fuentes | `src/main/java/com/ijgomez/template/` | `src/main/java/org/myorganization/template/` |
| `scanBasePackages` | `com.ijgomez.template` | `org.myorganization.template` |
| Configuración de logging | `com.ijgomez.template: DEBUG` | `org.myorganization.template: DEBUG` |

Los cambios se aplicaron en:
- 7 ficheros POM (parent + 5 módulos + template-liquibase)
- 6 ficheros Java (package-info.java de cada módulo + TemplateApplication.java)
- 1 fichero de configuración (application-local.yml)

---

## Verificación

Tras aplicar ambas correcciones, se verificó que:

1. `cd template/template && mvn clean install -DskipTests` → **BUILD SUCCESS** (6 módulos)
2. `cd template/template-liquibase && mvn clean install -DskipTests` → **BUILD SUCCESS** (standalone)
3. La estructura de directorios coincide exactamente con la definida en `project-structure.md`
4. Los paquetes Java coinciden con la convención de `java-spring-boot.md`

---

## Lecciones aprendidas

1. **Estructura de directorios vs. artifactId**: En este proyecto, los nombres de directorio de los módulos Maven (`commons/`, `cluster/`, etc.) son diferentes al `artifactId` Maven (`template-commons`, `template-cluster`, etc.). Esto es una decisión deliberada para mantener los directorios limpios dentro del proyecto backend mientras se conservan `artifactId` descriptivos.

2. **Separación de proyectos**: `template-liquibase` no es un submódulo Maven del backend sino un proyecto independiente que gestiona las migraciones de forma autónoma. Esto permite ejecutar las migraciones sin necesidad de compilar todo el backend.

3. **GroupId alineado con paquete raíz**: El `groupId` de Maven debe coincidir con el paquete raíz Java definido en las coding guidelines (`org.myorganization.template`), no con el dominio del repositorio GitHub.
