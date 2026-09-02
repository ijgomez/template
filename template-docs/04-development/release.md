# Release y distribución

## Introducción

Esta guía describe el proceso para generar una distribución de la plataforma Template lista para entregar al cliente o desplegar en un entorno remoto (desarrollo, integración, QA o producción).

---

## Estrategia de versionado

El proyecto sigue [Semantic Versioning](https://semver.org/) (SemVer):

```
MAJOR.MINOR.PATCH
```

| Componente | Cuándo incrementar                                      |
|------------|---------------------------------------------------------|
| MAJOR      | Cambios incompatibles en la API o en el modelo de datos |
| MINOR      | Nueva funcionalidad compatible hacia atrás              |
| PATCH      | Correcciones de errores compatibles hacia atrás         |

La versión se mantiene sincronizada entre:

- `template/pom.xml` (backend — con sufijo `-SNAPSHOT` en desarrollo)
- `template/dashboard/package.json` (frontend)

---

## Flujo de release (GitFlow)

El proceso de release sigue el modelo GitFlow:

1. **Crear rama de release** desde `develop`:

   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b release/X.Y.Z
   ```

2. **Actualizar versiones** en la rama de release:

   ```bash
   # Backend: actualizar todos los POMs
   cd template
   mvn versions:set -DnewVersion=X.Y.Z
   mvn versions:commit

   # Frontend: actualizar package.json
   cd dashboard
   npm version X.Y.Z --no-git-tag-version
   ```

3. **Verificar la compilación completa**:

   ```bash
   cd template
   mvn clean verify -Ptest
   ```

4. **Generar los artefactos de distribución** (ver sección siguiente).

5. **Merge a `master`** y crear tag:

   ```bash
   git checkout master
   git merge --no-ff release/X.Y.Z
   git tag -a vX.Y.Z -m "Release X.Y.Z"
   git push origin master --tags
   ```

6. **Merge a `develop`**:

   ```bash
   git checkout develop
   git merge --no-ff release/X.Y.Z
   git push origin develop
   ```

7. **Eliminar la rama de release**:

   ```bash
   git branch -d release/X.Y.Z
   git push origin --delete release/X.Y.Z
   ```

---

## Generar artefactos de distribución

### Script de empaquetado

El directorio `template-dist/` contiene scripts que automatizan la generación de artefactos:

#### Linux / macOS

```bash
chmod +x template-dist/linux/*.sh    # Solo la primera vez
./template-dist/linux/package.sh
```

#### Windows

```cmd
template-dist\windows\package.bat
```

### Operaciones del script

El script `package` realiza:

1. **Backend:** `mvn clean package -Pdist -DskipTests`
   - Genera el WAR con el perfil de distribución.
   - La configuración queda externalizada (sin valores hardcoded).
2. **Frontend:** `npm install` + `ng build --configuration production`
   - Build optimizado con hashing, tree-shaking y Service Worker.

### Artefactos generados

| Artefacto          | Ubicación                                             | Descripción                     |
|--------------------|-------------------------------------------------------|---------------------------------|
| WAR del backend    | `template/webapp/target/template-webapp-X.Y.Z.war`    | Aplicación backend empaquetada  |
| Frontend compilado | `template/dashboard/dist/dashboard/browser/`          | Ficheros estáticos del frontend |

El WAR generado con el perfil `dist` incluye automáticamente el frontend compilado en `static/`, resultando en un artefacto único desplegable.

---

## Configuración de distribución

### Backend (perfil `dist`)

El perfil `dist` externaliza toda la configuración sensible mediante variables de entorno. El fichero `application-dist.yml` declara:

| Variable de entorno            | Descripción                       | Obligatoria    |
|--------------------------------|-----------------------------------|:--------------:|
| `DB_URL`                       | URL JDBC de conexión a PostgreSQL | Sí             |
| `DB_USERNAME`                  | Usuario de base de datos          | Sí             |
| `DB_PASSWORD`                  | Contraseña de base de datos       | Sí             |
| `JWT_SECRET`                   | Clave para firmar tokens JWT      | Sí             |
| `JWT_ACCESS_TOKEN_EXPIRATION`  | Expiración del access token (ms)  | No (900000)    |
| `JWT_REFRESH_TOKEN_EXPIRATION` | Expiración del refresh token (ms) | No (604800000) |
| `CORS_ALLOWED_ORIGINS`         | Orígenes CORS permitidos          | Sí             |
| `SERVER_PORT`                  | Puerto del servidor               | No (8080)      |
| `CLUSTER_HEARTBEAT_INTERVAL`   | Intervalo de heartbeat (ms)       | No (30000)     |
| `CLUSTER_DEAD_NODE_TIMEOUT`    | Timeout de nodos inactivos (ms)   | No (300000)    |

### Frontend

El build de distribución usa `environment.dist.ts`, que se configura en tiempo de build con los valores del entorno de destino.

### Repositorio de propiedades

Para entornos gestionados, la configuración se almacena en el directorio `template-properties/` (no incluido en el repositorio principal por contener valores sensibles). Cada entorno tiene su propio fichero de propiedades.

---

## Despliegue

### Despliegue manual del WAR

1. Copiar el WAR al servidor:

   ```bash
   scp template/webapp/target/template-webapp-X.Y.Z.war usuario@servidor:/ruta/despliegue/
   ```

2. Arrancar la aplicación con las variables de entorno del entorno destino:

   ```bash
   export DB_URL=jdbc:postgresql://db-server:5432/template_pro
   export DB_USERNAME=template_pro
   export DB_PASSWORD=<contraseña-produccion>
   export JWT_SECRET=<clave-produccion-min-32-chars>
   export CORS_ALLOWED_ORIGINS=https://app.midominio.com

   java -jar template-webapp-X.Y.Z.war --spring.profiles.active=dist
   ```

### Despliegue con Docker

Construir las imágenes de distribución:

```bash
cd template-docker
docker compose build
```

Las imágenes resultantes pueden subirse a un registro de contenedores:

```bash
docker tag template-backend:latest registro.midominio.com/template-backend:X.Y.Z
docker tag template-frontend:latest registro.midominio.com/template-frontend:X.Y.Z
docker push registro.midominio.com/template-backend:X.Y.Z
docker push registro.midominio.com/template-frontend:X.Y.Z
```

### Script de despliegue (placeholder)

El proyecto incluye scripts de despliegue que deben personalizarse según la infraestructura:

```bash
# Linux / macOS
./template-dist/linux/deploy.sh pro

# Windows
template-dist\windows\deploy.bat pro
```

El parámetro indica el entorno de destino: `dev`, `int`, `qa` o `pro`.

---

## Entornos de despliegue

| Entorno     | Código | Descripción                                   |
|-------------|--------|-----------------------------------------------|
| Desarrollo  | `dev`  | Entorno compartido de desarrollo              |
| Integración | `int`  | Integración continua y pruebas de integración |
| QA          | `qa`   | Pruebas de calidad y aceptación               |
| Producción  | `pro`  | Entorno productivo                            |

---

## Checklist de release

Antes de entregar una distribución al cliente, verificar:

- [ ] La versión se ha actualizado en `pom.xml` y `package.json`.
- [ ] Todos los tests pasan (`mvn clean verify -Ptest`).
- [ ] El build de distribución se genera sin errores (`package.sh` / `package.bat`).
- [ ] Las migraciones de Liquibase están incluidas y son compatibles.
- [ ] Se ha creado el tag en Git (`vX.Y.Z`).
- [ ] Se ha generado un changelog con los cambios incluidos en la release.
- [ ] La documentación está actualizada si hay cambios funcionales.
- [ ] Las variables de entorno del destino están documentadas y disponibles.

---

## Hotfix

Para correcciones urgentes en producción:

1. Crear rama desde `master`:

   ```bash
   git checkout master
   git checkout -b hotfix/X.Y.Z
   ```

2. Aplicar la corrección e incrementar PATCH.

3. Seguir el mismo proceso de empaquetado y despliegue.

4. Merge a `master` (con tag) y a `develop`.

---

## Resumen de comandos

| Acción                      | Comando                                      | Directorio            |
|-----------------------------|----------------------------------------------|-----------------------|
| Actualizar versión backend  | `mvn versions:set -DnewVersion=X.Y.Z`       | `template/`           |
| Actualizar versión frontend | `npm version X.Y.Z --no-git-tag-version`    | `template/dashboard/` |
| Empaquetar (Linux)          | `./template-dist/linux/package.sh`           | Raíz del workspace    |
| Empaquetar (Windows)        | `template-dist\windows\package.bat`          | Raíz del workspace    |
| Crear tag                   | `git tag -a vX.Y.Z -m "Release X.Y.Z"`      | Raíz del workspace    |
| Build Docker                | `docker compose build`                       | `template-docker/`    |
| Desplegar (Linux)           | `./template-dist/linux/deploy.sh [entorno]`  | Raíz del workspace    |
| Desplegar (Windows)         | `template-dist\windows\deploy.bat [entorno]` | Raíz del workspace    |
