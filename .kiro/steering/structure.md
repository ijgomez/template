# Estructura del Proyecto

## Estructura del Workspace

```
template/                          ← Raíz del workspace
├── template/                      ← Backend principal (multi-módulo Maven)
│   ├── pom.xml                    ← POM padre (parent Spring Boot 4.1.0)
│   ├── commons/                   ← Utilidades compartidas entre módulos Java
│   ├── cluster/                   ← Gestión y coordinación del cluster y alta disponibilidad
│   ├── domain/                    ← Entidades JPA, DTOs, modelo de dominio
│   ├── core/                      ← Servicios, DAOs, lógica de negocio, workers
│   └── webapp/                    ← WAR Spring Boot: controladores, config, seguridad
├── template-dashboard/            ← Frontend (Angular 22)
├── template-dist/                 ← Scripts de build y despliegue por sistema operativo
├── template-docker/               ← Configuraciones Docker
├── template-liquibase/            ← Migraciones de base de datos (changelogs Liquibase)
├── template-properties/           ← Ficheros de propiedades por entorno
├── .kiro/
│   └── steering/                  ← Ficheros de guía para el asistente IA
├── .gitignore
└── README.md
```

## Responsabilidad de cada Módulo

| Módulo                | Capa            | Responsabilidad                                                                         |
|-----------------------|-----------------|-----------------------------------------------------------------------------------------|
| `commons`             | Transversal     | Clases de utilidad compartidas entre módulos (mantener al mínimo)                       |
| `cluster`             | Infraestructura | Coordinación del cluster, heartbeat de nodos, distribución de tareas                    |
| `domain`              | Dominio         | Entidades JPA, DTOs, enums de dominio, plantillas Velocity                              |
| `core`                | Servicio        | Servicios de negocio, DAOs, workers planificados, gestión transaccional                 |
| `webapp`              | Presentación    | Endpoints REST/SOAP, controladores, config Spring Security, clase principal Spring Boot |
| `template-dashboard`  | Frontend        | Aplicación Angular 22 con Bootstrap 5.3.8                                               |
| `template-liquibase`  | Base de datos   | Changelogs Liquibase organizados por versión para PostgreSQL 18                         |
| `template-dist`       | Despliegue      | Scripts de empaquetado y despliegue para cada sistema operativo                         |
| `template-docker`     | Despliegue      | Dockerfiles y docker-compose para los distintos entornos                                |
| `template-properties` | Configuración   | Copia de seguridad de los ficheros de configuración de cada entorno                     |

## Entornos y Perfiles de Compilación

### Entornos

El proyecto contempla cinco entornos de ejecución:

| Entorno       | Código  | Descripción                                                    |
|---------------|---------|----------------------------------------------------------------|
| Local         | `local` | Máquina del desarrollador                                      |
| Desarrollo    | `dev`   | Entorno compartido de desarrollo                               |
| Integración   | `int`   | Entorno de integración continua y pruebas de integración       |
| QA            | `qa`    | Entorno de pruebas de calidad / aceptación                     |
| Producción    | `pro`   | Entorno productivo                                             |

### Perfiles Maven

A la hora de compilar existen **tres perfiles Maven**:

| Perfil         | Entorno(s) que cubre         | Descripción                                                        |
|----------------|------------------------------|--------------------------------------------------------------------|
| `local`        | Local                        | Configuración para desarrollo local (BD local, logs en DEBUG, etc.)|
| `dist`         | Desarrollo, Integración, QA, Producción | Compilación para distribución. La configuración específica de cada entorno se externaliza en `template-properties`. |
| `test`         | —                            | Ejecuta los tests (unitarios e integración). Activa plugins de testing, cobertura JaCoCo y análisis SonarQube. |

Activar el perfil en compilación:

```bash
./mvnw clean package -P local         # Build para entorno local
./mvnw clean package -P dist          # Build para distribución (cualquier entorno remoto)
./mvnw clean verify -P test           # Ejecutar tests + cobertura
```

El perfil `dist` genera un artefacto genérico que no incluye configuración específica de entorno. La configuración correcta se inyecta en despliegue desde `template-properties/<entorno>/`.

### Módulo template-properties

Este módulo actúa como **copia de seguridad** de los ficheros de configuración de cada entorno. Contiene una carpeta por entorno con los ficheros de propiedades correspondientes:

```
template-properties/
├── local/                  ← Configuración del entorno local
│   ├── application.yml
│   └── ...
├── dev/                    ← Configuración del entorno de desarrollo
│   ├── application.yml
│   └── ...
├── int/                    ← Configuración del entorno de integración
│   ├── application.yml
│   └── ...
├── qa/                     ← Configuración del entorno de QA
│   ├── application.yml
│   └── ...
└── pro/                    ← Configuración del entorno de producción
    ├── application.yml
    └── ...
```

Reglas:

- Cada entorno tiene su propia carpeta con el código del entorno como nombre.
- Los ficheros de configuración sensibles (contraseñas, tokens, claves) **no se versionan**. Solo se guardan plantillas o propiedades no sensibles.
- Los ficheros de este módulo son la referencia para saber qué configuración tiene cada entorno en un momento dado.

## Dependencias entre Módulos Maven

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

## Convenciones

- Usar kebab-case para todos los nombres de directorios y módulos.
- Mantener el modelo de ramas: `master` para código estable, `release/*` para candidatos a release.
- No añadir lógica de negocio en `webapp`; delegar siempre a `core`.
- No añadir dependencias de Spring en `domain`; debe ser un módulo Java puro (salvo JPA).
- Los ficheros de propiedades sensibles (contraseñas, tokens) nunca se versionen; usar `template-properties` solo para plantillas o propiedades no sensibles.
- Los changelogs de Liquibase se mantienen en formato **XML** dentro de `template-liquibase`.
- Las reglas detalladas de cada área están en los ficheros de steering correspondientes: `coding-java.md`, `coding-maven.md`, `coding-api.md`, `coding-security.md`, `coding-liquibase.md`, `coding-angular.md`.
