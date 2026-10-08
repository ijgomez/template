# Template Docker

template-docker es un ejemplo de infraestructura del entorno de desarrollo para la plataforma Template.
Permite levantar de forma local los servicios de base de datos (PostgreSQL) y servidor de aplicaciones (WildFly) mediante Docker Compose.

## Requisitos previos

- [Docker](https://docs.docker.com/get-docker/) (versión 24 o superior)
- [Docker Compose](https://docs.docker.com/compose/) (incluido en Docker Desktop)

## Configuración

1. Copiar el fichero de variables de entorno:

```bash
cp .env.example .env
```

2. Editar `.env` con los valores deseados (credenciales de base de datos, puertos, etc.).

## Uso

### Arrancar todos los servicios (recomendado)

```bash
./compose.sh start
```

Esto levantará:

| Servicio   | Puerto | Descripción                    |
|------------|--------|--------------------------------|
| PostgreSQL | 5432   | Base de datos                  |
| WildFly    | 8080   | HTTP del servidor de aplicaciones |
| WildFly Management | 9990 | Consola de administración de WildFly |
| OpenProject | 8088   | Gestión de proyectos           |

`./compose.sh start` fuerza reconstrucción de imágenes (`docker compose up -d --build`) para que cambios en Dockerfile y scripts se apliquen automáticamente.

### Reinicializar desde cero (incluyendo volumen de datos)

```bash
./compose.sh reset
```

Este comando elimina contenedores y volúmenes y vuelve a construir/levantar servicios. Úsalo cuando cambies scripts de inicialización de PostgreSQL.

### Ver logs

```bash
docker compose logs -f
```

Para ver los logs de un servicio concreto:

```bash
docker compose logs -f postgres
docker compose logs -f wildfly
docker compose logs -f openproject
```

### Detener todos los servicios

```bash
./compose.sh stop
```

### Detener y eliminar volúmenes (datos)

```bash
docker compose down -v
```

## Estructura

```text
template-docker/
├── docker-compose.yml      ← Orquestación de servicios
├── compose.sh              ← Script de arranque/parada/reset
├── .env.example            ← Variables de entorno de ejemplo
├── openproyect/
│   └── Dockerfile          ← Imagen de OpenProject personalizada
├── postgres/
│   ├── Dockerfile          ← Imagen de PostgreSQL personalizada
│   ├── init-tablespaces.sh ← Crea rutas físicas de tablespaces
│   └── init.sql            ← Inicializa roles, schema y tablespaces
├── wildfly/
│   ├── Dockerfile          ← Imagen de WildFly personalizada
│   └── docker-entrypoint.sh ← Crea usuario admin y arranca WildFly
└── README.md               ← Este fichero
```

## Servicios

### PostgreSQL 18

- Build local desde `postgres/Dockerfile` (base `postgres:18`)
- Puerto: configurable via `POSTGRES_PORT` (por defecto 5432)
- Los datos se persisten en un volumen Docker (`postgres-data`) montado en `/var/lib/postgresql`
- `PGDATA` se fija en `/var/lib/postgresql/18/docker` para seguir el esquema recomendado en 18+
- Inicialización al primer arranque del volumen:
  - Schema `template`
  - Tablespaces `template_data_tbs` y `template_index_tbs`
  - Roles `template_admin` y `template_user`

### WildFly

- Build local desde `wildfly/Dockerfile` (base `quay.io/wildfly/wildfly:latest-jdk21`)
- Puerto HTTP: configurable via `WILDFLY_HTTP_PORT` (por defecto 8080)
- Puerto de gestión: configurable via `WILDFLY_MANAGEMENT_PORT` (por defecto 9990)
- Crea automáticamente el usuario de administración (si no existe) a través de:
  - `WILDFLY_ADMIN_USER`
  - `WILDFLY_ADMIN_PASSWORD`
- Espera a que PostgreSQL esté saludable antes de arrancar

### OpenProject

- Build local desde `openproyect/Dockerfile` (base `openproject/openproject:17`)
- Puerto HTTP: configurable via `OPENPROJECT_PORT` (por defecto 8088 mapeado al 80 interno)
- Los datos y adjuntos se persisten en los volúmenes `openproject-assets` y `openproject-pgdata`
- Configuración de host y HTTPS configurable mediante `OPENPROJECT_HOST_NAME` y `OPENPROJECT_HTTPS`

## Variables de entorno

Archivo de referencia: `.env.example`

- PostgreSQL
  - `POSTGRES_DB`
  - `POSTGRES_USER`
  - `POSTGRES_PASSWORD`
  - `POSTGRES_PORT`
- WildFly
  - `WILDFLY_HTTP_PORT`
  - `WILDFLY_MANAGEMENT_PORT`
  - `WILDFLY_ADMIN_USER`
  - `WILDFLY_ADMIN_PASSWORD`
- OpenProject
  - `OPENPROJECT_PORT`
  - `OPENPROJECT_HOST_NAME`
  - `OPENPROJECT_SECRET_KEY_BASE`
  - `OPENPROJECT_HTTPS`

