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

| Módulo | Responsabilidad |
|---|---|
| `commons` | Utilidades genéricas, helpers y clases compartidas reutilizables por cualquier módulo |
| `cluster` | Coordinación de cluster, alta disponibilidad, gestión de nodos |
| `domain` | Entidades JPA, DTOs, interfaces de repositorio, modelo de dominio puro |
| `core` | Servicios de negocio, DAOs, workers, lógica de aplicación |
| `webapp` | Controladores REST, seguridad, configuración Spring Boot, punto de entrada (WAR) |
| `template-dashboard` | Aplicación frontend Angular 22 con Bootstrap 5.3.8 |
| `template-liquibase` | Changelogs Liquibase organizados por versión para PostgreSQL 18 |
| `template-dist` | Scripts de empaquetado y despliegue para cada sistema operativo |
| `template-docker` | Dockerfiles y docker-compose para los distintos entornos |
| `template-properties` | Ficheros de configuración externalizados por entorno (dev, pre, pro) |

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
- No añadir lógica de negocio en `template-web`; delegar siempre a `template-core`.
- No añadir dependencias de Spring en `template-domain`; debe ser un módulo Java puro (salvo JPA).
- Los ficheros de propiedades sensibles (contraseñas, tokens) nunca se versionen; usar `template-properties` solo para plantillas o propiedades no sensibles.
