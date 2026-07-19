# Gestión de Versiones y Control de Código

## Control de Versiones

- **Herramienta:** Git con Git LFS habilitado
- **Remoto:** GitHub (`https://github.com/ijgomez/template`)

---

## Estrategia de Branching (GitFlow)

El proyecto sigue el modelo GitFlow para organizar el desarrollo.

| Rama | Propósito | Origen | Destino merge |
|------|-----------|--------|---------------|
| `master` | Código estable y listo para producción | — | — |
| `develop` | Integración continua del desarrollo | `master` | `master` (via release) |
| `feature/*` | Desarrollo de nuevas funcionalidades | `develop` | `develop` |
| `release/*` | Preparación de una nueva versión | `develop` | `master` y `develop` |
| `hotfix/*` | Correcciones urgentes en producción | `master` | `master` y `develop` |

### Flujo de trabajo

```mermaid
gitGraph
    commit id: "v2.0.0"
    branch develop
    commit id: "init develop"
    branch feature/user-auth
    commit id: "add login"
    commit id: "add logout"
    checkout develop
    merge feature/user-auth
    branch release/2.1.0
    commit id: "bump version"
    checkout master
    merge release/2.1.0 id: "v2.1.0" tag: "v2.1.0"
    checkout develop
    merge release/2.1.0
```

### Reglas de branching

- Nunca hacer push directo a `master` ni a `develop`; siempre via pull request.
- Las ramas `feature/*` se nombran descriptivamente: `feature/user-authentication`, `feature/cluster-lock-service`.
- Las ramas `release/*` incluyen la versión: `release/2.1.0`.
- Las ramas `hotfix/*` incluyen la versión del parche: `hotfix/2.0.1`.
- Eliminar la rama de feature/hotfix tras el merge.
- Las ramas `feature/*` deben estar actualizadas con `develop` antes de solicitar merge (rebase o merge de develop).

---

## Versionado Semántico (SemVer)

El proyecto sigue [Semantic Versioning 2.0.0](https://semver.org/):

```
MAJOR.MINOR.PATCH
```

| Componente | Cuándo incrementar |
|------------|-------------------|
| **MAJOR** | Cambios incompatibles en la API o en el modelo de datos |
| **MINOR** | Nueva funcionalidad compatible con versiones anteriores |
| **PATCH** | Correcciones de errores compatibles con versiones anteriores |

### Reglas de versionado

- La versión se mantiene en `pom.xml` (backend) y `package.json` (frontend).
- Las ramas `release/*` incrementan MINOR (o MAJOR si hay breaking changes).
- Las ramas `hotfix/*` incrementan PATCH.
- Se crea un tag Git en `master` con cada release: `v2.1.0`, `v2.0.1`.
- Las versiones en desarrollo usan sufijo `-SNAPSHOT` en Maven: `2.1.0-SNAPSHOT`.
- Frontend y backend comparten el mismo número de versión.

### Ejemplos

| Situación | Versión anterior | Versión nueva |
|-----------|-----------------|---------------|
| Nueva funcionalidad (informes) | 2.0.0 | 2.1.0 |
| Corrección de bug en login | 2.1.0 | 2.1.1 |
| Cambio en modelo de datos (breaking) | 2.1.1 | 3.0.0 |

---

## Tags y Releases

- Cada merge a `master` genera un tag con el formato `vMAJOR.MINOR.PATCH`.
- Los tags se crean sobre el commit de merge en `master`, nunca sobre ramas intermedias.
- Cada tag debe tener asociada una release en GitHub con un changelog descriptivo.

---

## Convención de Mensajes de Commit

Los mensajes de commit pueden estar en español o inglés y deben seguir un formato descriptivo:

```
<tipo>: <descripción breve>

[cuerpo opcional con más detalle]
```

### Tipos permitidos

| Tipo | Uso |
|------|-----|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de error |
| `refactor` | Refactorización sin cambio funcional |
| `docs` | Cambios en documentación |
| `test` | Añadir o modificar tests |
| `chore` | Tareas de mantenimiento (dependencias, CI, etc.) |
| `style` | Cambios de formato (no afectan lógica) |
| `perf` | Mejoras de rendimiento |

### Ejemplos

```
feat: añadir endpoint de exportación de informes a PDF
fix: corregir validación de tipo en parámetros BOOLEAN
refactor: extraer lógica de lock a ClusterLockService
docs: documentar estrategia de branching
```
