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
| `template-properties` | Configuración   | Ficheros de configuración externalizados por entorno (dev, pre, pro)                    |

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
