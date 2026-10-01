# Implementation Plan — Seed data Liquibase para E2E en perfil local (H2)

## Objetivo

Que, arrancando el backend con el perfil `local` (H2 en memoria), existan filas en `parameter`,
`interface` (configuración) e `interface_log` (monitor), suficientes para que los tests E2E de
Playwright del dashboard dejen de fallar por tablas vacías. Cambio acotado al módulo `domain`
(solo changelogs Liquibase + el master). NO se tocan tests E2E, Angular, environments, `target/`,
el perfil de arranque ni la configuración de datasource.

## Causa raíz confirmada durante la exploración

- `data/v1.0.0/20250120-seed-local-interface-log.xml` tiene su único bloqueo de datos en
  `<sql dbms="postgresql">`. Liquibase evalúa el driver real (`org.h2.Driver`), por lo que en
  local/H2 ese `<sql>` se IGNORA y `interface_log` queda con 0 filas (API `interfaces/monitor` →
  totalElements: 0). Además usa sintaxis exclusiva de PostgreSQL (`generate_series`, subíndices
  `ARRAY[...][n]`, `setval`) que H2 no soporta.
- No existe seed para la tabla `parameter` → pantalla de Parámetros vacía ("No data available").
- No existe seed para la tabla `interface` (configuración) → endpoint `interfaces/configuration` → `[]`.

## Decisiones de diseño (con justificación)

1. **interface_log compatible con H2 — opción (b): reescribir con filas explícitas vía `<insert>`.**
   Se elige reescribir en vez de añadir un segundo `<sql dbms="h2">`. Motivo: `generate_series` no
   existe en H2 y emularlo con SQL recursivo complica el changeSet y diverge del estilo del repo.
   Los seeds que SÍ corren hoy en H2 (`seed-local-reports`, `seed-local-cluster-node`,
   `seed-local-admin`) usan elementos `<insert>` de Liquibase (totalmente agnósticos de motor) y
   `ALTER SEQUENCE ... RESTART WITH` (válido en H2 y PostgreSQL). Replicamos ese enfoque: filas
   `<insert>` explícitas, agnósticas de motor, que funcionan en H2 y PostgreSQL por igual. Se
   mantiene el changeSet existente INMUTABLE (regla Liquibase: nunca modificar un changeSet ya
   aplicado) y se sustituye su efecto con un changeSet nuevo con id distinto y preCondition
   `COUNT(*)=0`, de modo que no rompe PostgreSQL (perfiles dist) ni la inmutabilidad.
   > Nota: el changeSet original `20250120-seed-local-interface-log` seguía siendo inofensivo en
   > PostgreSQL (su `<sql dbms="postgresql">` ya insertaba 755 filas allí). Para no duplicar filas
   > en PostgreSQL, el changeSet nuevo lleva preCondition `sqlCheck COUNT(*)=0`, igual que el resto
   > de seeds; si PostgreSQL ya tiene las 755 del original, el nuevo quedará MARK_RAN y no inserta.

2. **Reset de secuencias por motor (patrón `seed-local-cluster-node`).** H2 no soporta `setval(...)`;
   PostgreSQL sí. Para cada tabla sembrada con ids explícitos se añade un reset de secuencia con
   dos `<sql>` separados: `<sql dbms="postgresql">SELECT setval(...)</sql>` y
   `<sql dbms="h2">ALTER SEQUENCE ... RESTART WITH ...</sql>`. Esto evita el `setval` roto en H2 del
   seed original y mantiene las secuencias coherentes en ambos motores.

3. **Nuevos ficheros y numeración.** Se siguen el patrón de nombres y la numeración existente:
   - `data/v1.0.0/20250122-seed-local-parameter.xml`
   - `data/v1.0.0/20250123-seed-local-interface.xml`
   - `data/v1.0.0/20250124-seed-local-interface-log-h2.xml` (reescritura compatible)
   Todos con `context="local"`, `author="template"`, `labels="v1.0.0"`, `<comment>`,
   `<preConditions onFail="MARK_RAN">` (tableExists + `sqlCheck COUNT(*)=0`) y `<rollback>`.

## Datos de referencia confirmados (leídos del código)

- **Tabla `parameter`** (`20250107-create-parameter-table.xml`): columnas `id BIGINT PK`,
  `code VARCHAR(100) NOT NULL UNIQUE`, `description VARCHAR(500)`, `parameter_value VARCHAR(500)`,
  `type VARCHAR(20) NOT NULL`, `created_at TIMESTAMP WITH TIME ZONE` (default CURRENT_TIMESTAMP),
  `last_modified_at TIMESTAMP WITH TIME ZONE` (default CURRENT_TIMESTAMP). Secuencia `parameter_seq`.
  Enum `ParameterType`: `STRING, INTEGER, BOOLEAN, DATE` (valores válidos para la columna `type`).
- **Tabla `interface`** (`20250109-create-interface-table.xml`): `id BIGINT PK`,
  `name VARCHAR(255) NOT NULL`, `description VARCHAR(500)`, `url VARCHAR(500) NOT NULL`,
  `protocol VARCHAR(50) NOT NULL`, `status VARCHAR(20) NOT NULL`, `check_frequency INTEGER NOT NULL`,
  `created_at`/`last_modified_at TIMESTAMP WITH TIME ZONE` default CURRENT_TIMESTAMP. Secuencia
  `interface_seq`. Enum `InterfaceStatus`: `ACTIVE, INACTIVE, ERROR`. `protocol` es texto libre
  (p.ej. `REST`, `SOAP`, `FTP`, `SFTP`).
- **Tabla `interface_log`** (`20250110-create-interface-log-table.xml`): `id BIGINT PK`,
  `timestamp TIMESTAMP WITH TIME ZONE NOT NULL`, `operation_type VARCHAR(10) NOT NULL`,
  `interface_name VARCHAR(255) NOT NULL`, `request_payload TEXT`, `response_payload TEXT`,
  `status VARCHAR(20) NOT NULL`. Secuencia `interface_log_seq`. Enum `InterfaceOperationType`:
  `GET, POST, PUT, PATCH, DELETE`. Enum `InterfaceLogStatus`: `SUCCESS, ERROR, BAD_REQUEST, NOT_FOUND`.
- **Rutas API** (context-path `/template`): login `POST /template/api/v1/auth/login`
  (admin/admin123); monitor `GET /template/api/v1/interfaces/monitor?page=0&size=5`;
  configuración `GET /template/api/v1/interfaces/configuration`; parámetros
  `GET /template/api/v1/administration/parameters` (controlador en `webapp`, no en `ws`).
- **Requisitos de datos de los tests E2E** (confirmados en los specs):
  - interfaces-monitor: la lista debe tener filas (`rows.count() > 0`); el filtro `POST`+`ERROR`
    debe poder devolver al menos una fila que contenga `POST` y `ERROR`; el filtro `GET` debe poder
    exportar CSV; page size 5 debe devolver 1..5 filas → se necesitan > 10 filas en total.
  - parameters: `should list parameters` exige `rows.count() > 0`.
  - interface (configuración): poblar el combo "Interface" del monitor y la pantalla de config →
    varias filas.

## Pasos

- [ ] 1. Crear el seed de parámetros `data/v1.0.0/20250122-seed-local-parameter.xml`.
      ChangeSet `id="20250122-seed-local-parameter"`, `author="template"`, `labels="v1.0.0"`,
      `context="local"`. preConditions `onFail="MARK_RAN"`: `<tableExists tableName="parameter"/>` +
      `<sqlCheck expectedResult="0">SELECT COUNT(*) FROM parameter</sqlCheck>`. Insertar ~10 filas con
      `<insert tableName="parameter">` usando ids explícitos 1..10, `code` único (p.ej.
      `SESSION_TIMEOUT`, `MAX_LOGIN_ATTEMPTS`, `MAINTENANCE_MODE`, `DEFAULT_PAGE_SIZE`,
      `REPORT_RETENTION_DAYS`, `SMTP_HOST`, `AUDIT_ENABLED`, `BATCH_SIZE`, `EXPORT_FORMAT`,
      `CLUSTER_HEARTBEAT_MS`), `description`, `parameter_value` y `type` de {STRING, INTEGER, BOOLEAN,
      DATE} (al menos uno de cada). No fijar `created_at`/`last_modified_at` (default
      CURRENT_TIMESTAMP). Añadir changeSet de reset de secuencia (id
      `20250122-seed-local-parameter-seq-reset`, `context="local"`, preConditions tableExists +
      `<sequenceExists sequenceName="parameter_seq"/>`) con `<sql dbms="postgresql">SELECT
      setval('parameter_seq', (SELECT COALESCE(MAX(id),0)+1 FROM parameter), false)</sql>` y
      `<sql dbms="h2">ALTER SEQUENCE parameter_seq RESTART WITH 100</sql>`. `<rollback>`:
      `<delete tableName="parameter"/>` en el primer changeSet y `<rollback/>` vacío en el reset.
      Files: `template/domain/src/main/resources/db/changelog/data/v1.0.0/20250122-seed-local-parameter.xml`
      Verify: parte del build/arranque del paso 5 (ver verificación por API).

- [ ] 2. Crear el seed de configuración de interfaces `data/v1.0.0/20250123-seed-local-interface.xml`.
      ChangeSet `id="20250123-seed-local-interface"`, mismos atributos y preConditions que el paso 1
      pero sobre `interface` (`tableExists` + `COUNT(*)=0`). Insertar ~6 filas con
      `<insert tableName="interface">` ids 1..6, columnas `name`, `description`, `url`,
      `protocol` (REST/SOAP/FTP/SFTP), `status` de {ACTIVE, INACTIVE, ERROR}, `check_frequency`
      (INTEGER, p.ej. 60/300/900). Los `name` deben ser representativos para poblar el combo
      "Interface" del monitor. No fijar `created_at`/`last_modified_at`. Añadir changeSet de reset de
      secuencia `interface_seq` con el mismo patrón dual H2/PostgreSQL del paso 1 (RESTART WITH 100 en
      H2; setval en PostgreSQL). `<rollback>` con `<delete tableName="interface"/>`.
      Files: `template/domain/src/main/resources/db/changelog/data/v1.0.0/20250123-seed-local-interface.xml`
      Verify: parte del build/arranque del paso 5.

- [ ] 3. Crear la reescritura H2-compatible del seed de logs
      `data/v1.0.0/20250124-seed-local-interface-log-h2.xml`. ChangeSet nuevo
      `id="20250124-seed-local-interface-log-h2"`, `context="local"`, con preConditions
      `onFail="MARK_RAN"`: `<tableExists tableName="interface_log"/>` +
      `<sqlCheck expectedResult="0">SELECT COUNT(*) FROM interface_log</sqlCheck>` (así no duplica si
      PostgreSQL ya aplicó el seed original). Insertar entre 20 y 40 filas con
      `<insert tableName="interface_log">` (agnóstico de motor), ids explícitos consecutivos,
      cubriendo: `operation_type` en {GET, POST, PUT, PATCH, DELETE} y `status` en {SUCCESS, ERROR,
      BAD_REQUEST, NOT_FOUND}; INCLUIR obligatoriamente al menos UNA fila con `operation_type=POST` y
      `status=ERROR`, y VARIAS filas con `operation_type=GET`. Fijar `timestamp` con `valueDate` (o
      literal ISO que H2 acepte, p.ej. `2025-01-10 08:15:00`), `interface_name` coherente con los
      nombres del paso 2, y `request_payload`/`response_payload` con JSON de ejemplo. Añadir changeSet
      de reset de secuencia `interface_log_seq` con el patrón dual H2/PostgreSQL. `<rollback>`:
      `<delete tableName="interface_log"/>` (o por rango de ids insertados).
      Files: `template/domain/src/main/resources/db/changelog/data/v1.0.0/20250124-seed-local-interface-log-h2.xml`
      Verify: parte del build/arranque del paso 5. NO modificar el fichero original
      `20250120-seed-local-interface-log.xml` (inmutable; sigue sirviendo en PostgreSQL).

- [ ] 4. Registrar los tres nuevos changelogs en `db.changelog-master.xml`, al final de la sección de
      seeds data/v1.0.0, inmediatamente después del `<include>` de
      `20250120-seed-local-interface-log.xml`, con `relativeToChangelogFile="true"` y en este orden:
      `20250122-seed-local-parameter.xml`, `20250123-seed-local-interface.xml`,
      `20250124-seed-local-interface-log-h2.xml`. El orden es independiente entre sí (no hay FKs
      entre estas tablas), pero se respeta la numeración.
      Files: `template/domain/src/main/resources/db/changelog/db.changelog-master.xml`
      Verify: parte del build del paso 5.

- [ ] 5. Verificar build y datos por API.
      Build: desde `template/template`, ejecutar `mvn -pl domain,webapp -am clean install -DskipTests`
      y confirmar BUILD SUCCESS (valida que el XML de Liquibase es correcto y que domain+webapp
      compilan).
      Arranque: arrancar el webapp en background con el perfil `local`, p.ej.
      `mvn -pl webapp -am spring-boot:run -Dspring-boot.run.profiles=local` (o el jar generado con
      `--spring.profiles.active=local`), esperar a que escuche en el puerto 8080.
      Comprobación por API (context-path `/template`):
        1. Login: `curl -s -X POST http://localhost:8080/template/api/v1/auth/login
           -H 'Content-Type: application/json' -d '{"username":"admin","password":"admin123"}'`
           → 200 OK con accessToken; guardar el token.
        2. Monitor: `curl -s -H "Authorization: Bearer <token>"
           'http://localhost:8080/template/api/v1/interfaces/monitor?page=0&size=5'`
           → JSON con `totalElements` > 10 y `content` con 5 elementos.
        3. Configuración: `curl -s -H "Authorization: Bearer <token>"
           'http://localhost:8080/template/api/v1/interfaces/configuration'`
           → array NO vacío (varias interfaces).
        4. Parámetros: `curl -s -H "Authorization: Bearer <token>"
           'http://localhost:8080/template/api/v1/administration/parameters?page=0&size=20'`
           → JSON con `totalElements` > 0 y `content` no vacío.
      Opcional (filtro clave del test): `.../interfaces/monitor?operationType=POST&status=ERROR`
      → al menos 1 elemento, confirmando la fila POST+ERROR del paso 3.
      Al terminar, detener el proceso del webapp en background. No dejar artefactos.
      Files: ninguno (solo verificación).

## Riesgos y notas

- Si al arrancar en local Liquibase marcara el changeSet original `20250120-seed-local-interface-log`
  como aplicado pero sin filas (porque su `<sql dbms="postgresql">` no corre en H2), la preCondition
  `COUNT(*)=0` del nuevo `20250124` seguirá siendo verdadera y por tanto insertará: la lógica no
  depende del DATABASECHANGELOG del original sino del contenido real de la tabla. Correcto.
- Mantener los `<insert>` agnósticos de motor evita divergencias H2/PostgreSQL. Los únicos bloques
  específicos de motor son los resets de secuencia (`setval` PG / `ALTER SEQUENCE RESTART` H2),
  replicando `seed-local-cluster-node`.
- No usar `generate_series` ni subíndices `ARRAY[...][n]`: son PostgreSQL-only y rompen en H2.
```