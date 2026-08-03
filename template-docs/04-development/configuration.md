# Configuración del entorno de desarrollo

## Introducción

Esta guía describe los pasos para configurar el entorno de desarrollo local una vez instalado el [software necesario](installation.md). Al finalizar, se dispondrá de una base de datos operativa, el backend y el frontend listos para trabajar.

---

## Base de datos

El proyecto utiliza PostgreSQL 18 como base de datos. Existen dos opciones para configurarla en local.

### Opción 1: PostgreSQL con Docker (recomendada)

Es la forma más rápida de tener la base de datos disponible sin instalación adicional.

```bash
cd template-docker
cp .env.example .env    # Solo la primera vez
docker compose up -d postgres
```

Esto levanta una instancia de PostgreSQL 18 con la siguiente configuración por defecto:

| Parámetro | Valor       |
|-----------|-------------|
| Host      | `localhost` |
| Puerto    | `5432`      |
| Base      | `template`  |
| Usuario   | `template`  |
| Contraseña| `template`  |

Los valores pueden personalizarse editando el fichero `.env`.

### Opción 2: PostgreSQL local

Si se ha instalado PostgreSQL de forma nativa, crear la base de datos y el usuario:

```sql
CREATE USER template WITH PASSWORD 'template';
CREATE DATABASE template OWNER template;
GRANT ALL PRIVILEGES ON DATABASE template TO template;
```

Verificar la conexión:

```bash
psql -h localhost -U template -d template
```

### Migraciones de esquema (Liquibase)

Las migraciones se ejecutan automáticamente al arrancar la aplicación Spring Boot. No es necesario ejecutarlas manualmente salvo que se quiera aplicar migraciones sin arrancar el backend:

```bash
cd template-liquibase
mvn liquibase:update -Plocal
```

Los changelogs se encuentran en `template-liquibase/src/main/resources/db/changelog/` en formato XML.

---

## Configuración del backend

### Perfiles de Spring Boot

La aplicación utiliza perfiles para separar la configuración por entorno:

| Perfil  | Fichero                    | Uso                                                |
|---------|----------------------------|----------------------------------------------------|
| `local` | `application-local.yml`    | Desarrollo local (activo por defecto)              |
| `dist`  | `application-dist.yml`     | Distribución (variables externalizadas)            |
| `test`  | `application-test.yml`     | Tests (usa Testcontainers para PostgreSQL)          |

El perfil `local` se activa por defecto gracias al POM padre. No es necesario configurar nada adicional si se usa la base de datos con los valores por defecto.

### Variables de configuración local

El fichero `template/webapp/src/main/resources/application-local.yml` contiene:

| Propiedad                      | Valor por defecto                           | Descripción                         |
|--------------------------------|---------------------------------------------|-------------------------------------|
| `spring.datasource.url`       | `jdbc:postgresql://localhost:5432/template`  | URL de conexión a PostgreSQL        |
| `spring.datasource.username`  | `template`                                  | Usuario de base de datos            |
| `spring.datasource.password`  | `template`                                  | Contraseña de base de datos         |
| `server.port`                 | `8080`                                      | Puerto del servidor                 |
| `jwt.secret`                  | (clave de desarrollo)                       | Clave para firmar tokens JWT        |
| `jwt.access-token-expiration` | `3600000` (1h)                              | Tiempo de vida del access token     |
| `jwt.refresh-token-expiration`| `604800000` (7d)                            | Tiempo de vida del refresh token    |
| `cors.allowed-origins`        | `http://localhost:4200`                     | Orígenes CORS permitidos            |
| `cluster.heartbeat-interval`  | `30000` (30s)                               | Intervalo del heartbeat del cluster |
| `cluster.dead-node-timeout`   | `300000` (5min)                             | Timeout para nodos inactivos        |

### Personalizar la configuración local

Si se necesitan valores distintos (por ejemplo, otro puerto de base de datos), editar directamente `application-local.yml`. Este fichero no contiene credenciales de producción y está diseñado para ser modificado por cada desarrollador.

---

## Configuración del frontend

### Variables de entorno

La configuración del frontend se gestiona mediante ficheros `environment.ts` ubicados en `template-dashboard/src/environments/`:

| Fichero                | Configuración Angular | Uso              |
|------------------------|-----------------------|------------------|
| `environment.ts`       | `local`               | Desarrollo local |
| `environment.dist.ts`  | `dist`                | Distribución     |
| `environment.test.ts`  | `test`                | Tests            |

Variables principales en `environment.ts`:

| Variable             | Valor por defecto                | Descripción                    |
|----------------------|----------------------------------|--------------------------------|
| `apiUrl`             | `http://localhost:8080/template`  | URL base de la API backend     |
| `tokenRefreshMargin` | `60000`                          | Margen para renovar token (ms) |

### Instalar dependencias

```bash
cd template-dashboard
npm install
```

---

## Configuración del IDE

### IntelliJ IDEA (recomendado para backend)

1. Importar como proyecto Maven desde la raíz `template/`.
2. Configurar el SDK del proyecto a Java 21.
3. Marcar los directorios `src/main/java` como Sources Root y `src/test/java` como Test Sources Root en cada módulo.
4. Configurar el perfil de ejecución de Spring Boot:
   - Main class: la clase `@SpringBootApplication` en el módulo `webapp`.
   - Active profiles: `local`.
   - Working directory: `template/webapp`.

### VS Code / Kiro (recomendado para frontend)

1. Abrir la carpeta raíz del workspace (`template/`).
2. Instalar las extensiones recomendadas:
   - Angular Language Service
   - ESLint / Prettier
   - SCSS IntelliSense

---

## Docker: entorno completo (opcional)

Para levantar todo el stack (base de datos + backend + frontend) sin configuración manual:

```bash
cd template-docker
cp .env.example .env    # Solo la primera vez
docker compose up -d
```

Servicios disponibles:

| Servicio   | Puerto | Descripción                    |
|------------|--------|--------------------------------|
| PostgreSQL | 5432   | Base de datos                  |
| Backend    | 8080   | API REST (Spring Boot)         |
| Frontend   | 4200   | Aplicación Angular (via Nginx) |

Para detener:

```bash
docker compose down
```

Para detener y eliminar datos:

```bash
docker compose down -v
```

---

## Verificación del entorno

Una vez configurado todo, verificar que el entorno está operativo:

1. **Base de datos:** Conectar con `psql -h localhost -U template -d template` y comprobar que responde.
2. **Backend:** Arrancar con `mvn spring-boot:run -pl webapp -Plocal` desde `template/` y verificar que `http://localhost:8080/template` responde.
3. **Frontend:** Arrancar con `ng serve` desde `template-dashboard/` y verificar que `http://localhost:4200` carga la aplicación.

---

## Resolución de problemas

| Problema                       | Solución                                                                    |
|--------------------------------|-----------------------------------------------------------------------------|
| Error de conexión a PostgreSQL | Verificar que PostgreSQL está arrancado y las credenciales coinciden         |
| `Port 8080 already in use`     | Detener el proceso que ocupa el puerto o cambiar en `application-local.yml` |
| `Port 4200 already in use`     | Usar `ng serve --port 4201`                                                 |
| `JAVA_HOME` no configurado     | Configurar la variable de entorno apuntando al JDK 21                       |
| `ng: command not found`        | Instalar Angular CLI: `npm install -g @angular/cli@22`                      |
| Migraciones Liquibase fallan   | Verificar conexión a BD y que el schema existe                              |
| Docker no arranca              | Verificar que Docker Desktop está ejecutándose                              |

---

## Siguiente paso

Con el entorno configurado, consultar la guía de [construcción y arranque](build.md) para compilar y ejecutar el proyecto.
