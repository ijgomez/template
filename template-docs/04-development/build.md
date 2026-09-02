# Construcción y arranque

## Introducción

Esta guía describe cómo compilar, ejecutar tests y arrancar la plataforma Template en un entorno de desarrollo local. Asume que el entorno ya está [configurado](configuration.md).

---

## Backend

### Estructura de módulos

El backend es un proyecto Maven multi-módulo. La compilación sigue el orden de dependencias:

```
commons → cluster → domain → core → webapp
```

### Compilar el proyecto completo

Desde la raíz del backend (`template/`):

```bash
cd template
mvn clean install
```

Este comando:

1. Compila todos los módulos en el orden correcto.
2. Ejecuta los tests unitarios.
3. Instala los artefactos en el repositorio local de Maven.

Para compilar sin ejecutar tests:

```bash
mvn clean install -DskipTests
```

### Compilar un módulo individual

Para compilar un módulo concreto (por ejemplo, durante el desarrollo de una funcionalidad específica):

```bash
mvn clean install -pl core -am
```

La opción `-am` (also make) compila las dependencias del módulo indicado.

### Ejecutar tests

Tests unitarios:

```bash
mvn test
```

Tests unitarios + tests de integración:

```bash
mvn verify
```

Tests con cobertura (JaCoCo) y análisis estático (SonarQube):

```bash
mvn clean verify -Ptest
```

El perfil `test` usa Testcontainers para levantar automáticamente una instancia de PostgreSQL durante los tests de integración. Requiere Docker en ejecución.

#### Convenciones de nombrado de tests

| Patrón               | Plugin     | Tipo                |
|----------------------|------------|---------------------|
| `*Test.java`         | Surefire   | Test unitario       |
| `*Tests.java`        | Surefire   | Test unitario       |
| `*Properties.java`   | Surefire   | Property-based      |
| `*IT.java`           | Failsafe   | Test de integración |

### Arrancar la aplicación

Desde la raíz del backend:

```bash
mvn spring-boot:run -pl webapp -Plocal
```

La aplicación arranca en `http://localhost:8080/template` con el perfil `local`.

Alternativamente, si ya se ha compilado el WAR:

```bash
java -jar webapp/target/template-webapp-0.1.0-SNAPSHOT.war --spring.profiles.active=local
```

### Context path

La aplicación se despliega bajo el context path `/template`. Todas las URLs de la API tienen el prefijo:

```
http://localhost:8080/template/api/v1/...
```

---

## Frontend

### Instalar dependencias

```bash
cd template/dashboard
npm install
```

### Arrancar en modo desarrollo

```bash
ng serve
```

Equivale a `npm start`. La aplicación estará disponible en `http://localhost:4200` con recarga automática al detectar cambios.

Por defecto se usa la configuración `local` (definida en `angular.json`).

Para arrancar con otra configuración:

```bash
ng serve --configuration=dist
```

### Compilar para distribución

```bash
ng build
```

Por defecto usa la configuración `dist` (optimización, hashing, Service Worker). Los artefactos se generan en `template/dashboard/dist/dashboard/browser/`.

Para compilar con configuración local (sin optimizaciones, con sourcemaps):

```bash
ng build --configuration=local
```

### Ejecutar tests

```bash
ng test
```

Los tests se ejecutan con Vitest. El proyecto usa `fast-check` para tests basados en propiedades.

---

## Build integrado (backend + frontend)

El módulo `webapp` incluye el plugin `frontend-maven-plugin` que compila automáticamente el frontend durante el build de Maven:

```bash
cd template
mvn clean install
```

Este proceso:

1. Instala Node.js localmente (via frontend-maven-plugin).
2. Ejecuta `npm install` en `template/dashboard/`.
3. Ejecuta `ng build` con la configuración correspondiente al perfil Maven activo.
4. Copia los artefactos compilados del frontend a `webapp/target/classes/static/`.
5. Empaqueta todo en un WAR único.

Para saltar la compilación del frontend (si solo se trabaja en el backend):

```bash
mvn clean install -Dfrontend.skip=true
```

### Correspondencia de perfiles Maven y Angular

| Perfil Maven | Configuración Angular | Resultado                                |
|--------------|-----------------------|------------------------------------------|
| `local`      | `local`               | Sin optimización, sourcemaps habilitados |
| `dist`       | `dist`                | Optimizado, hashing, Service Worker      |
| `test`       | `test`                | Sin optimización, environment de test    |

---

## Scripts de compilación

El directorio `template-dist/` contiene scripts que automatizan el proceso de build:

### Linux / macOS

```bash
# Dar permisos (solo la primera vez)
chmod +x template-dist/linux/*.sh

# Compilar backend + frontend
./template-dist/linux/build.sh
```

### Windows

```cmd
template-dist\windows\build.bat
```

Estos scripts ejecutan:

1. Backend: `mvn clean install` (compila y ejecuta tests).
2. Frontend: `npm install` + `ng build`.

---

## Docker

Para compilar y arrancar todo el stack con Docker:

```bash
cd template-docker
docker compose up -d --build
```

Esto construye las imágenes (backend y frontend) con builds multi-stage y levanta todos los servicios.

Para reconstruir solo un servicio:

```bash
docker compose build backend
docker compose up -d backend
```

---

## Resumen de comandos

| Acción                             | Comando                                  | Directorio            |
|------------------------------------|------------------------------------------|-----------------------|
| Compilar backend                   | `mvn clean install`                      | `template/`           |
| Compilar sin tests                 | `mvn clean install -DskipTests`          | `template/`           |
| Ejecutar tests unitarios           | `mvn test`                               | `template/`           |
| Tests + cobertura                  | `mvn clean verify -Ptest`                | `template/`           |
| Arrancar backend                   | `mvn spring-boot:run -pl webapp -Plocal` | `template/`           |
| Instalar deps frontend             | `npm install`                            | `template/dashboard/` |
| Arrancar frontend                  | `ng serve`                               | `template/dashboard/` |
| Compilar frontend                  | `ng build`                               | `template/dashboard/` |
| Tests frontend                     | `ng test`                                | `template/dashboard/` |
| Build integrado (backend+frontend) | `mvn clean install`                      | `template/`           |
| Build con Docker                   | `docker compose up -d --build`           | `template-docker/`    |

---

## Siguiente paso

Para generar una distribución entregable al cliente, consultar la guía de [release](release.md).
