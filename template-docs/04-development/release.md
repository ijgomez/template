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
   - El WAR es un WAR plano para WildFly: sin los drivers H2 y PostgreSQL (los aporta WildFly) y sin `WEB-INF/lib-provided` (no es ejecutable con `java -jar`).
   - Sólo incluye `application.yml` y `application-dist.yml`.
   - La configuración queda externalizada (sin valores hardcoded).
2. **Frontend:** `npm install` + `ng build --configuration production`
   - Build optimizado con hashing, tree-shaking y Service Worker.

### Artefactos generados

| Artefacto          | Ubicación                                             | Descripción                     |
|--------------------|-------------------------------------------------------|---------------------------------|
| WAR del backend    | `template/webapp/target/template.war`                 | Aplicación backend empaquetada  |
| Frontend compilado | `template/dashboard/dist/dashboard/browser/`          | Ficheros estáticos del frontend |

El WAR generado con el perfil `dist` incluye automáticamente el frontend compilado en `static/`, resultando en un artefacto único desplegable.

---

## Configuración de distribución

### Perfiles Maven y de Spring

Cada perfil Maven fija el perfil de Spring que se empaqueta (`application-<perfil>.yml`). El WAR sólo incluye el `application-<perfil>.yml` del perfil con el que se compila.

| Perfil Maven | Perfil de Spring | Uso                                   | Drivers H2/PostgreSQL en el WAR | WAR                          |
|--------------|------------------|---------------------------------------|:-------------------------------:|------------------------------|
| (sin `-P`)   | `dist`           | Por defecto seguro (SEC-04)           | No                              | Plano, para contenedor       |
| `dist`       | `dist`           | Despliegue (dev, int, qa, pro)        | No                              | Plano, para contenedor       |
| `local`      | `local`          | Desarrollo en la máquina del desarrollador | Sí                         | Ejecutable (`java -jar`)     |
| `test`       | `test`           | Tests de integración y CI             | Sí                              | Ejecutable (`java -jar`)     |

Un build sin `-P` nunca genera un artefacto con configuración de desarrollo (SEC-04). `mvn spring-boot:run` sin `-P` arranca en `local`.

### Backend (perfil `local`)

Fichero `application-local.yml`. No requiere configuración externa.

| Propiedad              | Valor                                                    |
|------------------------|----------------------------------------------------------|
| Base de datos          | H2 en memoria (modo compatibilidad PostgreSQL)           |
| Liquibase              | Activo, `db.changelog-local.xml`, contexto `local` (esquema y semillas locales) |
| Servidor               | Puerto 8080                                              |
| JWT                    | Secreto fijo de desarrollo (no usar fuera de local)      |
| Cookie de refresh      | `refresh-token`, `Secure=false`, `SameSite=Lax`          |
| CORS                   | `http://localhost:4200`                                  |
| Logging                | Detallado (`DEBUG`/`TRACE`)                              |

### Backend (perfil `test`)

Fichero `application-test.yml`. Pensado para tests de integración y CI.

| Propiedad       | Valor                                                       |
|-----------------|-------------------------------------------------------------|
| Base de datos   | PostgreSQL 18 con Testcontainers (requiere Docker)          |
| Servidor        | Puerto aleatorio (`0`)                                      |
| JWT             | Secreto fijo de pruebas                                     |
| CORS            | `http://localhost:4200`                                     |
| Cluster         | Intervalos cortos (heartbeat 5 s, nodo inactivo 15 s)       |
| Logging         | Lo controla `logback-test.xml`                              |

### Backend (perfil `dist`)

Fichero `application-dist.yml`. Pensado para desplegar en WildFly. La infraestructura (datasource, logging, puertos y HTTPS) se configura en WildFly y la aplicación sólo recibe lo que necesita por variables.

Valores fijados por el perfil:

| Propiedad                       | Valor                                         | Motivo                                              |
|---------------------------------|-----------------------------------------------|-----------------------------------------------------|
| `spring.datasource.jndi-name`   | `java:jboss/datasources/TemplateDS`           | El DataSource lo aporta WildFly                     |
| `spring.liquibase.enabled`      | `false`                                       | No se ejecuta ningún changeset al arrancar          |
| `spring.jpa.hibernate.ddl-auto` | `validate`                                    | Sólo valida el modelo de datos, no modifica nada    |

Variables (propiedades del sistema o del entorno de WildFly):

| Variable                       | Descripción                                          | Obligatoria    |
|--------------------------------|------------------------------------------------------|:--------------:|
| `JWT_SECRET`                   | Clave para firmar tokens JWT (mín. 32 caracteres). Debe ser la misma en todos los nodos del cluster | Sí             |
| `JWT_ACCESS_TOKEN_EXPIRATION`  | Expiración del access token (ms)                     | No (900000)    |
| `JWT_REFRESH_TOKEN_EXPIRATION` | Expiración del refresh token (ms)                    | No (604800000) |
| `AUTH_COOKIE_NAME`             | Nombre de la cookie de refresh                       | No (`__Host-refresh-token`) |
| `AUTH_COOKIE_PATH`             | Ruta de la cookie de refresh                         | No (`/template/api/v1/auth`) |
| `AUTH_COOKIE_MAX_AGE`          | Duración de la cookie (s)                            | No (604800)    |
| `AUTH_COOKIE_SECURE`           | Cookie sólo por HTTPS                                | No (`true`)    |
| `AUTH_COOKIE_SAME_SITE`        | Política `SameSite` de la cookie                     | No (`Strict`)  |
| `CLUSTER_HEARTBEAT_INTERVAL`   | Intervalo de heartbeat (ms)                          | No (30000)     |
| `CLUSTER_DEAD_NODE_TIMEOUT`    | Timeout de nodos inactivos (ms)                      | No (300000)    |

Notas:

- Las variables `DB_URL`, `DB_USERNAME` y `DB_PASSWORD` ya no las lee el WAR. Siguen usándose en los scripts `generate-sql` de `template-dist`.
- `CORS_ALLOWED_ORIGINS` y `SERVER_PORT` no se definen en `dist`: el frontend va dentro del WAR (mismo origen) y el puerto lo fija WildFly. Se aplican los valores de `application.yml`.
- El logging se configura en el subsistema `logging` de WildFly, no en el YAML. Con `LoggingSystem=none` Spring Boot ignora `logging.level.*`.
- Con `AUTH_COOKIE_SECURE=true` hace falta HTTPS. Por HTTP plano hay que definir `AUTH_COOKIE_SECURE=false` y un `AUTH_COOKIE_NAME` sin el prefijo `__Host-`.

### Esquema de base de datos en `dist`

Como Liquibase está desactivado en `dist`, el esquema `template`, las tablas y los datos iniciales deben existir antes de desplegar el WAR. Se generan con `template-dist/linux/generate-sql.sh` (o `generate-sql.bat`) y se aplican en la base de datos de destino. Si el modelo no coincide con las entidades, la aplicación no arranca (`ddl-auto: validate`).

### Configuración de WildFly

Requisitos en el servidor para el perfil `dist`:

| Elemento               | Configuración                                                                    |
|------------------------|----------------------------------------------------------------------------------|
| Driver PostgreSQL      | Módulo `org.postgresql` y driver `postgresql` en el subsistema `datasources`     |
| DataSource             | `TemplateDS` con JNDI `java:jboss/datasources/TemplateDS`                        |
| `JWT_SECRET`           | Propiedad del sistema (`/system-property=JWT_SECRET:add(value=...)`) o variable de entorno del proceso |
| HTTPS                  | `https-listener` de Undertow (puerto 8443 por defecto)                           |
| Proxy inverso          | Si hay un balanceador que termina HTTPS (Apache), `proxy-address-forwarding=true` en el `http-listener` de Undertow. Sin ello Spring cree que la petición es `http` con `Origin` `https` y devuelve 403 (CORS) en los recursos del navegador |
| Logging                | Logging profile `template` (imprescindible: el WAR de `dist` lo referencia en el MANIFEST y el despliegue puede fallar si no existe) y propiedad del sistema `org.springframework.boot.logging.LoggingSystem=none` (imprescindible: sin ella Spring Boot reconfigura `java.util.logging` y los logs de la aplicación no llegan a `server.log`) y fichero propio `template.log` (ver «Logs de la aplicación en WildFly») |

#### Logs de la aplicación en WildFly

Los logs de la aplicación y de sus frameworks se escriben en `standalone/log/template.log`, con rotación diaria, y no aparecen en `server.log`. Se consigue con un **logging profile** de WildFly (`template`), que aísla esta configuración de la global del servidor. El fichero se ve en la consola en Runtime → Log Files.

El WAR de `dist` referencia el perfil con la entrada `Logging-Profile: template` de su `META-INF/MANIFEST.MF` (propiedad Maven `war.logging.profile`, vacía en `local` y `test`). **El perfil debe existir en WildFly antes de desplegar el WAR.** Se crea con el CLI:

```
/subsystem=logging/logging-profile=template:add
/subsystem=logging/logging-profile=template/pattern-formatter=PATTERN:add(pattern="%d{yyyy-MM-dd HH:mm:ss,SSS} %-5p [%c] (%t) %s%e%n")
/subsystem=logging/logging-profile=template/periodic-rotating-file-handler=TEMPLATE:add(file={relative-to=jboss.server.log.dir, path=template.log}, suffix=.yyyy-MM-dd, append=true, autoflush=true, named-formatter=PATTERN)
/subsystem=logging/logging-profile=template/root-logger=ROOT:add(level=INFO, handlers=[TEMPLATE])
/subsystem=logging/logging-profile=template/logger=org.myorganization.template:add(level=DEBUG)
/subsystem=logging/logging-profile=template/logger=org.springframework.security:add(level=WARN)
/subsystem=logging/logging-profile=template/logger=org.hibernate:add(level=WARN)
/subsystem=logging/logging-profile=template/logger=org.liquibase:add(level=WARN)
```

| Categoría                          | Nivel | Contenido                                  |
|------------------------------------|-------|--------------------------------------------|
| (raíz del perfil)                  | INFO  | Spring y el resto de librerías             |
| `org.myorganization.template`      | DEBUG | Código de la aplicación                    |
| `org.springframework.security`     | WARN  | Spring Security                            |
| `org.hibernate`                    | WARN  | Hibernate y Hibernate Validator            |
| `org.liquibase`                    | WARN  | Liquibase                                  |

Para cambiar el nivel de una categoría: `/subsystem=logging/logging-profile=template/logger=<categoría>:write-attribute(name=level, value=DEBUG)`. Requiere `org.springframework.boot.logging.LoggingSystem=none`. Los logs del propio WildFly siguen en `server.log`.

La imagen `template-docker/wildfly` ya incluye el driver, el datasource `TemplateDS` y HTTPS con certificado autofirmado (sólo pruebas). El entrypoint lee `jwt_secret` del fichero `template-docker/secrets/credentials.env` y lo exporta como `JWT_SECRET`.

### Frontend

El build de distribución usa `environment.dist.ts`, que se configura en tiempo de build con los valores del entorno de destino.

### Repositorio de propiedades

Para entornos gestionados, la configuración se almacena en el directorio `template-properties/` (no incluido en el repositorio principal por contener valores sensibles). Cada entorno tiene su propio fichero de propiedades.

---

## Despliegue

### Despliegue manual del WAR en WildFly

1. Preparar WildFly según la sección «Configuración de WildFly» (datasource `TemplateDS`, `JWT_SECRET` y HTTPS) y aplicar en la base de datos el SQL del esquema.

2. Copiar el WAR al servidor y desplegarlo:

   ```bash
   scp template/webapp/target/template.war usuario@servidor:/ruta/wildfly/standalone/deployments/
   ```

   El WAR de `dist` no es ejecutable con `java -jar`: se arranca siempre dentro de WildFly.

3. Comprobar en el log de WildFly que la aplicación arranca y que la validación del modelo no reporta errores.

### Despliegue con Docker

Los servicios `wildfly-1` y `wildfly-2` de `template-docker/docker-compose.yml` usan la imagen `template-wildfly`. Construir las imágenes:

```bash
cd template-docker
docker compose build
```

Antes de arrancar, `template-docker/secrets/credentials.env` debe incluir `jwt_secret` (compartido por todos los nodos), además de las contraseñas de PostgreSQL y de la consola de WildFly.

Puertos por defecto de los nodos: HTTP 8081/8082, HTTPS 8444/8445 y gestión 9991/9992.

Las imágenes resultantes pueden subirse a un registro de contenedores:

```bash
docker tag template-wildfly:latest registro.midominio.com/template-wildfly:X.Y.Z
docker push registro.midominio.com/template-wildfly:X.Y.Z
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
- [ ] El esquema de base de datos del destino está creado y actualizado (Liquibase está desactivado en `dist`).
- [ ] WildFly tiene el datasource `TemplateDS`, `JWT_SECRET` y HTTPS configurados.
- [ ] Las variables opcionales del destino (`AUTH_COOKIE_*`, `CLUSTER_*`) están documentadas y disponibles.

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
