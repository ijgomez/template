# Instalación del proyecto

## Introducción

Esta guía describe los pasos necesarios para configurar el entorno de desarrollo y poner en marcha la plataforma Template en una máquina local.

---

## Requisitos previos

### Software necesario

| Software       | Versión mínima | Descripción                              |
|----------------|----------------|------------------------------------------|
| JDK            | 21             | Java Development Kit                     |
| Maven          | 3.9+           | Gestión de dependencias y build (backend)|
| Node.js        | 20 LTS         | Runtime para herramientas frontend       |
| npm            | 10+            | Gestor de paquetes frontend              |
| Angular CLI    | 22             | Herramienta de línea de comandos Angular |
| PostgreSQL     | 18             | Base de datos relacional                 |
| Git            | 2.40+          | Control de versiones                     |
| Docker         | 24+            | Contenedorización (opcional)             |
| Docker Compose | 2.20+          | Orquestación de contenedores (opcional)  |

### Verificar versiones instaladas

```bash
java -version          # Debe mostrar Java 21+
mvn -version           # Debe mostrar Maven 3.9+
node -version          # Debe mostrar v20+
npm -version           # Debe mostrar 10+
ng version             # Debe mostrar Angular CLI 22+
psql --version         # Debe mostrar PostgreSQL 18+
git --version          # Debe mostrar 2.40+
docker --version       # Opcional: Docker 24+
docker compose version # Opcional: Docker Compose 2.20+
```

---

## Clonar el repositorio

```bash
git clone https://github.com/ijgomez/template.git
cd template
```

El repositorio contiene todos los componentes del proyecto organizados según la [estructura del proyecto](../01-introduction/project-structure.md).

---

## Base de datos

### Opción 1: PostgreSQL local

1. Crear la base de datos y el usuario:

```sql
CREATE USER template_user WITH PASSWORD 'template_pass';
CREATE DATABASE template_db OWNER template_user;
GRANT ALL PRIVILEGES ON DATABASE template_db TO template_user;
```

2. Verificar la conexión:

```bash
psql -h localhost -U template_user -d template_db
```

### Opción 2: Docker

```bash
cd template-docker
docker compose up -d postgres
```

Esto levanta una instancia de PostgreSQL 18 con la configuración predefinida.

### Ejecutar migraciones Liquibase

Las migraciones se ejecutan automáticamente al arrancar la aplicación Spring Boot. Para ejecutarlas manualmente:

```bash
cd template-liquibase
mvn liquibase:update -Plocal
```

---

## Backend

### Compilar el proyecto

Desde la raíz del proyecto backend:

```bash
cd template
mvn clean install
```

Esto compila todos los módulos en orden de dependencias:

```
commons → cluster → domain → core → webapp
```

### Ejecutar tests

```bash
mvn test
```

Para ejecutar tests con cobertura (JaCoCo) y análisis estático (SonarQube):

```bash
mvn clean verify -Ptest
```

### Arrancar la aplicación

```bash
mvn spring-boot:run -pl webapp -Plocal
```

La aplicación arrancará en `http://localhost:8080` con el perfil `local`.

### Perfiles de compilación

| Perfil  | Uso                                                    |
|---------|--------------------------------------------------------|
| `local` | Desarrollo local (BD local, logs en DEBUG)             |
| `dist`  | Distribución (configuración externalizada)             |
| `test`  | Ejecución de tests con JaCoCo y SonarQube              |

---

## Frontend

### Instalar dependencias

```bash
cd template-dashboard
npm install
```

### Arrancar en modo desarrollo

```bash
ng serve
```

La aplicación estará disponible en `http://localhost:4200` y se recargará automáticamente al detectar cambios en el código fuente.

### Compilar para producción

```bash
ng build
```

Los artefactos se generan en el directorio `dist/`.

### Ejecutar tests

```bash
ng test
```

---

## Configuración por entorno

### Backend

La configuración específica de cada entorno se gestiona mediante:

- **Perfil local:** `application-local.yml` dentro del módulo `webapp`.
- **Perfiles de distribución:** Ficheros externalizados en el repositorio `template-properties`.

Variables clave de configuración:

| Variable                          | Descripción                             | Valor local por defecto         |
|-----------------------------------|-----------------------------------------|---------------------------------|
| `spring.datasource.url`           | URL de conexión a PostgreSQL            | `jdbc:postgresql://localhost:5432/template_db` |
| `spring.datasource.username`      | Usuario de base de datos                | `template_user`                 |
| `spring.datasource.password`      | Contraseña de base de datos             | `template_pass`                 |
| `app.jwt.secret`                  | Clave secreta para firmar tokens JWT    | (valor de desarrollo)           |
| `app.jwt.access-token-expiration` | Tiempo de expiración del access token   | `15m`                           |
| `app.jwt.refresh-token-expiration`| Tiempo de expiración del refresh token  | `7d`                            |
| `app.cluster.heartbeat-interval`  | Intervalo del heartbeat del cluster     | `30000` (ms)                    |

### Frontend

La configuración del frontend se gestiona mediante los ficheros `environment.ts`:

- `src/environments/environment.ts` — Desarrollo.
- `src/environments/environment.prod.ts` — Producción.

Variables clave:

| Variable           | Descripción                   | Valor local por defecto     |
|--------------------|-------------------------------|-----------------------------|
| `apiUrl`           | URL base de la API backend    | `http://localhost:8080/api`  |
| `tokenRefreshMargin` | Margen para renovar token (ms) | `60000`                   |

---

## Docker (entorno completo)

Para levantar todo el stack (base de datos + backend + frontend) con Docker Compose:

```bash
cd template-docker
docker compose up -d
```

Servicios disponibles:

| Servicio   | Puerto | Descripción            |
|------------|--------|------------------------|
| PostgreSQL | 5432   | Base de datos          |
| Backend    | 8080   | API REST               |
| Frontend   | 4200   | Aplicación Angular     |

Para detener:

```bash
docker compose down
```

---

## Verificación de la instalación

Una vez arrancados todos los componentes, verificar:

1. **Base de datos:** Conectar con `psql` y comprobar que las tablas existen.
2. **Backend:** Acceder a `http://localhost:8080/api/v1/auth/login` (debe responder, aunque con 401 si no se envían credenciales).
3. **Frontend:** Acceder a `http://localhost:4200` (debe mostrar la página de login).

---

## Resolución de problemas

| Problema                               | Solución                                                       |
|----------------------------------------|----------------------------------------------------------------|
| `Port 8080 already in use`             | Detener el proceso que ocupa el puerto o cambiar en `application-local.yml` |
| `Port 4200 already in use`             | Usar `ng serve --port 4201`                                    |
| Error de conexión a PostgreSQL         | Verificar que PostgreSQL está arrancado y las credenciales son correctas |
| `JAVA_HOME` no configurado            | Configurar la variable de entorno apuntando al JDK 21          |
| Error de compilación Maven             | Ejecutar `mvn clean install -U` para forzar actualización de dependencias |
| `ng: command not found`               | Instalar Angular CLI: `npm install -g @angular/cli@22`         |
| Migraciones Liquibase fallan           | Verificar conexión a BD y que el schema está limpio            |
