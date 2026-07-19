# Estructura del Proyecto

#[[file:template-docs/01-introduction/project-structure.md]]

## Convenciones

- Usar kebab-case para todos los nombres de directorios y módulos.
- Mantener el modelo de ramas: `master` para código estable, `release/*` para candidatos a release.
- No añadir lógica de negocio en `webapp`; delegar siempre a `core`.
- No añadir dependencias de Spring en `domain`; debe ser un módulo Java puro (salvo JPA).
- Los ficheros de propiedades sensibles (contraseñas, tokens) nunca se versionan; usar `template-properties` solo para plantillas o propiedades no sensibles.
- Los changelogs de Liquibase se mantienen en formato **XML** dentro de `template-liquibase`.

## Entornos y Perfiles de Compilación

### Entornos

| Entorno       | Código  | Descripción                                                    |
|---------------|---------|----------------------------------------------------------------|
| Local         | `local` | Máquina del desarrollador                                      |
| Desarrollo    | `dev`   | Entorno compartido de desarrollo                               |
| Integración   | `int`   | Entorno de integración continua y pruebas de integración       |
| QA            | `qa`    | Entorno de pruebas de calidad / aceptación                     |
| Producción    | `pro`   | Entorno productivo                                             |

### Perfiles Maven

| Perfil  | Entorno(s) que cubre                    | Descripción                                                                              |
|---------|-----------------------------------------|------------------------------------------------------------------------------------------|
| `local` | Local                                   | Configuración para desarrollo local (BD local, logs en DEBUG, etc.)                      |
| `dist`  | Desarrollo, Integración, QA, Producción | Compilación para distribución. La configuración se externaliza en `template-properties`. |
| `test`  | —                                       | Ejecuta los tests (unitarios e integración). Activa JaCoCo y SonarQube.                  |

### Dependencias entre Módulos Maven

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
