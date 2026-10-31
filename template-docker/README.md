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
| Apache     | 8090   | Balanceador de carga (punto de entrada único) |
| WildFly    | 8080   | HTTP del servidor de aplicaciones (nodo 1) |
| WildFly Management | 9990 | Consola de administración de WildFly (nodo 1) |
| WildFly 2  | 8081   | HTTP del servidor de aplicaciones (nodo 2) |
| WildFly 2 Management | 9991 | Consola de administración de WildFly (nodo 2) |
| OpenProject | 8088   | Gestión de proyectos           |
| Mail (SMTP) | 1025   | Servidor SMTP de pruebas (Mailpit) |
| Mail (UI)   | 8025   | Interfaz web para consultar los correos capturados |

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
docker compose logs -f apache
docker compose logs -f wildfly-1
docker compose logs -f wildfly-2
docker compose logs -f openproject
docker compose logs -f mail
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
├── apache/
│   ├── Dockerfile          ← Imagen de Apache HTTP Server
│   └── httpd.conf          ← Configuración del balanceador (mod_proxy_balancer)
├── mail/
│   └── Dockerfile          ← Imagen de Mailpit (servidor SMTP de pruebas)
├── openproject/
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
  - Base de datos `openproject` con tablespaces `openproject_data_tbs` y `openproject_index_tbs`
  - Base de datos y schema `template` con tablespaces `template_data_tbs` y `template_index_tbs`
  - Roles `template_admin` y `template_user`


### Apache (balanceador de carga)

- Build local desde `apache/Dockerfile` (base `httpd:2.4`)
- Puerto HTTP: configurable via `APACHE_HTTP_PORT` (por defecto 8090 mapeado al 80 interno)
- Punto de entrada único: reparte las peticiones entre `wildfly-1` y `wildfly-2` con `mod_proxy_balancer` en modo round-robin (`byrequests`)
- Sin sesiones pegajosas: la aplicación es stateless (autenticación JWT), por lo que cualquier nodo puede atender cualquier petición
- Si un nodo no responde, Apache deja de enviarle tráfico y lo reintenta tras `retry=5` segundos
- Reenvía todas las rutas, por lo que si el WAR se despliega con contexto `/template` el acceso es `http://localhost:8090/template/`
- Consola del balanceador: `http://localhost:8090/balancer-manager` (permite activar/desactivar nodos manualmente)
- Estado de Apache: `http://localhost:8090/server-status`
- Arranca después de los dos nodos WildFly (`depends_on`), aunque tolera que todavía no estén listos (devuelve `503` hasta que arrancan)

### WildFly

- Dos instancias (`wildfly-1` y `wildfly-2`) construidas desde la misma imagen (`template-wildfly:latest`, generada con `wildfly/Dockerfile`, base `quay.io/wildfly/wildfly:latest-jdk21`)
- Nodo 1:
  - Puerto HTTP: configurable via `WILDFLY_HTTP_PORT` (por defecto 8080)
  - Puerto de gestión: configurable via `WILDFLY_MANAGEMENT_PORT` (por defecto 9990)
- Nodo 2:
  - Puerto HTTP: configurable via `WILDFLY2_HTTP_PORT` (por defecto 8081)
  - Puerto de gestión: configurable via `WILDFLY2_MANAGEMENT_PORT` (por defecto 9991)
- Cada contenedor declara un `hostname` distinto (`template-wildfly-1` y `template-wildfly-2`). El módulo `cluster` usa el hostname como identificador de nodo, por lo que ambos se registran como nodos independientes.
- Ambos nodos comparten la misma base de datos: al desplegar `template.war` en cada instancia, los dos aparecen en **Administración > Cluster** y el heartbeat y la elección de maestro funcionan sobre ellos.
- Crea automáticamente el usuario de administración (si no existe) en cada instancia a través de:
  - `WILDFLY_ADMIN_USER`
  - `WILDFLY_ADMIN_PASSWORD`
- Espera a que PostgreSQL esté saludable antes de arrancar

> **Nota:** ambas instancias ejecutan WildFly en modo `standalone` (perfil por defecto). El clúster que se simula es el del módulo `cluster` de la aplicación (coordinación vía base de datos), no la replicación de sesiones/HA de WildFly. El acceso recomendado es a través del balanceador Apache (`http://localhost:8090`); los puertos 8080 y 8081 permiten acceder directamente a cada nodo para depuración.

### OpenProject

- Build local desde `openproject/Dockerfile` (base `openproject/openproject:17`)
- Puerto HTTP: configurable via `OPENPROJECT_PORT` (por defecto 8088 mapeado al 80 interno)
- Utiliza el servicio PostgreSQL (`postgres`) compartido mediante la base de datos `openproject`
- Los archivos adjuntos y datos de usuario se persisten en el volumen `openproject-assets`
- Configuración de host y HTTPS configurable mediante `OPENPROJECT_HOST_NAME` y `OPENPROJECT_HTTPS`
- Espera a que PostgreSQL esté saludable antes de arrancar

### Mail (Mailpit)

- Build local desde `mail/Dockerfile` (base `axllent/mailpit`)
- Servidor SMTP de pruebas: captura los correos enviados sin entregarlos a ningún destinatario real
- Puerto SMTP: configurable via `MAIL_SMTP_PORT` (por defecto 1025)
- Interfaz web: configurable via `MAIL_UI_PORT` (por defecto 8025), accesible en `http://localhost:8025`
- Acepta cualquier usuario/contraseña y conexiones sin TLS (`MP_SMTP_AUTH_ACCEPT_ANY` y `MP_SMTP_AUTH_ALLOW_INSECURE`); solo apto para desarrollo
- Desde otros contenedores el servidor SMTP es `mail:1025`; desde el host, `localhost:1025`

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
  - `WILDFLY2_HTTP_PORT`
  - `WILDFLY2_MANAGEMENT_PORT`
  - `WILDFLY_ADMIN_USER`
  - `WILDFLY_ADMIN_PASSWORD`
- Apache
  - `APACHE_HTTP_PORT`
- OpenProject
  - `OPENPROJECT_PORT`
  - `OPENPROJECT_HOST_NAME`
  - `OPENPROJECT_DB`
  - `OPENPROJECT_SECRET_KEY_BASE`
  - `OPENPROJECT_HTTPS`
- Mail
  - `MAIL_SMTP_PORT`
  - `MAIL_UI_PORT`


