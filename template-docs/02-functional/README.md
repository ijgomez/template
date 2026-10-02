# Documentación Funcional

Índice de la documentación funcional de la plantilla. Reúne la especificación de cada pantalla y módulo de la aplicación: qué hace, qué reglas de negocio aplica, cómo se comporta y cómo se verifica. Cada documento combina una parte funcional (qué cubre y qué flujos afecta) y una parte técnica (componentes, endpoints, modelo de datos y pruebas).

Para la documentación técnica transversal (layout, navegación, seguridad backend, API, modelo de datos) consulta `03-technical/`. Para la especificación global (glosario, requisitos de producto, casos de uso) consulta `specification/`.

## Convenciones

- Cada pantalla documenta sus requisitos con identificadores locales `RF-XXX-*` (funcionales) y `RNF-XXX-*` (no funcionales), donde `XXX` es un prefijo propio del documento.
- La estructura estándar de cada documento de pantalla es: encabezado con metadatos (ruta, componentes, endpoint, acceso), `1. Requisitos`, `2. Parte funcional`, `3. Parte técnica` y `4. Pruebas`.
- Los documentos de nivel superior de cada módulo (`administration.md`, `interfaces.md`, `security.md`, `cluster.md`) son índices que agrupan sus pantallas.

## Estructura

```text
02-functional/
├── login/                      Autenticación y acceso
│   ├── login.md                Pantalla de inicio de sesión
│   └── authentication.md       Modelo global de autenticación y sesión
├── reports/                    Módulo de Informes
│   └── reports.md
├── interfaces/                 Módulo de Interfaces
│   ├── interfaces.md           Índice del módulo
│   ├── monitor/monitor.md      Monitor de actividad de integraciones
│   └── configuration/          Configuración de interfaces
│       └── configuration.md
└── administration/             Módulo de Administración
    ├── administration.md       Índice del módulo
    ├── security/               Seguridad
    │   ├── security.md         Índice de seguridad
    │   ├── users.md            Gestión de usuarios
    │   ├── profiles.md         Gestión de perfiles
    │   └── actions.md          Catálogo de acciones (permisos)
    ├── parameters/parameters.md  Parámetros globales
    ├── audit/audit.md          Registro de auditoría
    └── cluster/                Cluster (alta disponibilidad)
        ├── cluster.md          Índice de cluster
        ├── cluster-nodes.md    Nodos del cluster
        └── cluster-blocks.md   Bloqueos del cluster
```

## Módulos y pantallas

### Login (Autenticación y acceso)

Punto de entrada de todos los usuarios y modelo de autenticación de la plataforma.

| Documento | Descripción |
|-----------|-------------|
| [Login](login/login.md) | Pantalla de inicio de sesión: formulario de credenciales, validaciones, gestión de errores, selección de idioma y redirección al dashboard. |
| [Autenticación y Gestión de Sesión](login/authentication.md) | Modelo global y transversal de autenticación: login y emisión de tokens, persistencia y recuperación de sesión, renovación del access token, logout, seguridad del refresh token y configuración externalizable (`RF-AUT-*` / `RNF-AUT-*`). |

### Informes

| Documento | Descripción |
|-----------|-------------|
| [Informes](reports/reports.md) | Ejecución de los informes asignados al usuario, con filtros dinámicos, paginación en servidor y exportación en múltiples formatos. Incluye el componente reutilizable de selección múltiple de informes. |

### Interfaces

Supervisión e integración de la aplicación con sistemas externos.

| Documento | Descripción |
|-----------|-------------|
| [Interfaces](interfaces/interfaces.md) | Índice del módulo: visión unificada del estado, la actividad y la configuración de las interfaces. |
| [Monitor](interfaces/monitor/monitor.md) | Monitor de actividad de las integraciones: consulta y filtrado de los logs de operación de las interfaces. |
| [Configuración](interfaces/configuration/configuration.md) | Consulta en solo lectura de la definición y el estado de las interfaces registradas, con filtros, detalle y exportación CSV. |

### Administración

Pantallas y dominios reservados a operadores y administradores.

| Documento | Descripción |
|-----------|-------------|
| [Administración](administration/administration.md) | Índice del módulo: agrupa seguridad, parámetros, auditoría y cluster. |

#### Seguridad

| Documento | Descripción |
|-----------|-------------|
| [Seguridad](administration/security/security.md) | Índice de las pantallas de seguridad (usuarios, perfiles y acciones). |
| [Usuarios](administration/security/users.md) | Consulta, alta, edición y eliminación de usuarios, con asignación de perfil e informes y exportación CSV. |
| [Perfiles](administration/security/profiles.md) | Consulta, alta, edición y eliminación de perfiles, con asociación de las acciones a las que dan acceso. |
| [Acciones](administration/security/actions.md) | Catálogo de permisos del sistema (semilla), con consulta, edición de metadatos y exportación; sin alta ni borrado. |

#### Parámetros

| Documento | Descripción |
|-----------|-------------|
| [Parámetros](administration/parameters/parameters.md) | Gestión de los parámetros globales de la aplicación, con validación de compatibilidad entre tipo y valor. |

#### Auditoría

| Documento | Descripción |
|-----------|-------------|
| [Auditoría](administration/audit/audit.md) | Consulta y exportación del registro de auditoría del sistema; de solo lectura desde la interfaz y la API. |

#### Cluster

Alta disponibilidad y coordinación de instancias.

| Documento | Descripción |
|-----------|-------------|
| [Cluster](administration/cluster/cluster.md) | Índice del módulo: instancias registradas, salud operativa, nodo maestro y bloqueos distribuidos. |
| [Nodos del Cluster](administration/cluster/cluster-nodes.md) | Consulta del estado de las instancias, filtrado, detalle, exportación y designación controlada del nodo maestro. |
| [Bloqueos del Cluster](administration/cluster/cluster-blocks.md) | Consulta de los registros de bloqueos (locks) con métricas de ejecución por tarea, filtrado y exportación CSV. |

## Referencias

- [Índice general de la documentación](../README.md)
- [Reglas de documentación](../04-development/coding-guidelines/documentation.md)
- [Requisitos de la aplicación](../specification/requirements.md)
- [Glosario](../specification/glossary.md)
