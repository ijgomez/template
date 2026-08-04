# Template Docker

Infraestructura Docker para la plataforma Template. Permite levantar todos los servicios (base de datos, backend y frontend) de forma local mediante Docker Compose.

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

### Arrancar todos los servicios

```bash
docker compose up -d
```

Esto levantará:

| Servicio   | Puerto | Descripción                    |
|------------|--------|--------------------------------|
| PostgreSQL | 5432   | Base de datos                  |
| Backend    | 8080   | API REST (Spring Boot)         |
| Frontend   | 4200   | Aplicación Angular (via Nginx) |

### Ver logs

```bash
docker compose logs -f
```

Para ver los logs de un servicio concreto:

```bash
docker compose logs -f backend
```

### Detener todos los servicios

```bash
docker compose down
```

### Detener y eliminar volúmenes (datos)

```bash
docker compose down -v
```

## Estructura

```text
template-docker/
├── docker-compose.yml      ← Orquestación de servicios
├── Dockerfile.backend      ← Build multi-stage del backend (Maven + JDK 21)
├── Dockerfile.frontend     ← Build multi-stage del frontend (Node + Nginx)
├── nginx.conf              ← Configuración Nginx para el frontend
├── .env.example            ← Variables de entorno de ejemplo
└── README.md               ← Este fichero
```

## Servicios

### PostgreSQL 18

- Imagen: `postgres:18`
- Puerto: configurable via `POSTGRES_PORT` (por defecto 5432)
- Los datos se persisten en un volumen Docker (`postgres-data`) montado en `/var/lib/postgresql`
- `PGDATA` se fija en `/var/lib/postgresql/18/docker` para seguir el esquema recomendado en 18+

### Backend

- Build multi-stage: compilación con Maven + ejecución con JDK 21
- Puerto: configurable via `BACKEND_PORT` (por defecto 8080)
- Espera a que PostgreSQL esté disponible antes de arrancar

### Frontend

- Build multi-stage: compilación con Node + servicio con Nginx
- Puerto: configurable via `FRONTEND_PORT` (por defecto 4200)
- Espera a que el backend esté disponible antes de arrancar
