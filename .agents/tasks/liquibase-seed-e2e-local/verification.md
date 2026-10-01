# Verificación — Seed data Liquibase para E2E en perfil local (H2)

## Cambios realizados

Módulo `domain`, solo changelogs Liquibase (sin tocar tests E2E, Angular, environments,
`target/`, perfil de arranque ni datasource):

- `data/v1.0.0/20250122-seed-local-parameter.xml` (nuevo): 10 filas en `parameter`
  (tipos STRING, INTEGER, BOOLEAN, DATE) + reset de secuencia dual H2/PostgreSQL.
- `data/v1.0.0/20250123-seed-local-interface.xml` (nuevo): 6 filas en `interface`
  (protocolos REST/SOAP/FTP/SFTP, estados ACTIVE/INACTIVE/ERROR) + reset de secuencia.
- `data/v1.0.0/20250124-seed-local-interface-log-h2.xml` (nuevo): 30 filas en
  `interface_log` vía `<insert>` agnósticos de motor (funcionan en H2 y PostgreSQL),
  cubriendo todos los `operation_type` {GET,POST,PUT,PATCH,DELETE} y `status`
  {SUCCESS,ERROR,BAD_REQUEST,NOT_FOUND}, con 3 filas POST+ERROR y 9 filas GET + reset
  de secuencia. preCondition `COUNT(*)=0` evita duplicar en PostgreSQL (donde el seed
  original `20250120` ya inserta sus 755 filas).
- `db.changelog-master.xml`: registrados los tres nuevos includes tras
  `20250120-seed-local-interface-log.xml`.

El changeSet original `20250120-seed-local-interface-log.xml` NO se modificó (inmutable;
sigue sirviendo en PostgreSQL vía su `<sql dbms="postgresql">`).

## 1) Compilación

Comando (desde `template/`):

```
mvn -q -pl domain,webapp -am clean install -DskipTests -Dfrontend.skip=true
```

Resultado: BUILD SUCCESS (exit 0). El XML de Liquibase valida y domain+webapp compilan.
Se usó `-Dfrontend.skip=true` porque el cambio es backend-only (no afecta al frontend).

## 2) Verificación por API (perfil local / H2)

El puerto 8080 estaba ocupado por una instancia previa SIN los datos, así que se arrancó
una instancia NUEVA en background en el puerto 8099 con el WAR recién compilado:

```
java -jar webapp/target/template-webapp-0.1.0-SNAPSHOT.war \
     --spring.profiles.active=local --server.port=8099
```

Log de arranque: Liquibase ejecutó `20250124-seed-local-interface-log-h2` ("30 New row
inserted into interface_log") y los seq-reset "ran successfully". App "Started
TemplateApplication".

Comprobaciones (context-path `/template`, login admin/admin123 → accessToken OK):

| Endpoint | Resultado | Criterio | OK |
|----------|-----------|----------|----|
| `GET /api/v1/interfaces/monitor?page=0&size=5` | `page.totalElements=30`, `content`=5 filas | >10 y 1..5 en primera página | ✅ |
| `GET /api/v1/interfaces/configuration` | array de 6 interfaces | no vacío | ✅ |
| `GET /api/v1/administration/parameters?page=0&size=20` | `content`=10 filas | >0 | ✅ |
| `GET /api/v1/interfaces/monitor?operationType=POST&status=ERROR` | `page.totalElements=2`, filas (POST,ERROR) | ≥1 | ✅ |

Nota: la respuesta paginada usa `page.totalElements` (no `totalElements` en la raíz).

## 3) Limpieza

- Proceso del webapp en 8099 detenido (`kill`), puerto liberado (sin procesos huérfanos).
- Fichero temporal `/tmp/webapp-8099.log` eliminado.
- Sin cambios en `target/` versionados.
- La instancia preexistente en 8080 NO se tocó.
