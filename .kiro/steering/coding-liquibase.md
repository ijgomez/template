# Reglas de Codificación — Liquibase

## General

- **Liquibase** gestiona todas las migraciones del esquema de base de datos (**PostgreSQL 18**).
- Nunca usar `spring.jpa.hibernate.ddl-auto: create`, `update` o `create-drop` en entornos que no sean de prueba local. El esquema lo controla Liquibase exclusivamente.
- Los ficheros de migración se ubican en `src/main/resources/db/changelog/`.

## Estructura de Ficheros

```
src/main/resources/db/
└── changelog/
    ├── db.changelog-master.yaml        # Fichero raíz que incluye los demás
    ├── migrations/
    │   ├── 20240101-create-user-table.yaml
    │   ├── 20240115-add-email-index.yaml
    │   └── ...
    └── data/
        └── 20240101-initial-data.yaml  # Datos iniciales / semilla (opcional)
```

- El fichero `db.changelog-master.yaml` solo contiene `include` o `includeAll`, nunca changesets directamente.

## Formato de Changesets

- Usar formato **YAML** como estándar del proyecto (alternativa XML si hay herramientas que lo requieran).
- Identificador del changeset: `<fecha>-<descripcion-kebab-case>`.
- Incluir siempre `author` y `id`:

```yaml
databaseChangeLog:
  - changeSet:
      id: 20240101-create-user-table
      author: javier.izquierdo
      changes:
        - createTable:
            tableName: users
            columns:
              - column:
                  name: id
                  type: BIGINT
                  autoIncrement: true
                  constraints:
                    primaryKey: true
                    nullable: false
              - column:
                  name: email
                  type: VARCHAR(255)
                  constraints:
                    nullable: false
                    unique: true
```

## Convenciones de Nomenclatura

| Elemento | Convención | Ejemplo |
|---|---|---|
| Ficheros | `YYYYMMDD-descripcion-kebab.yaml` | `20240101-create-user-table.yaml` |
| Tablas | snake_case, plural | `users`, `order_items` |
| Columnas | snake_case | `created_at`, `user_id` |
| Índices | `idx_<tabla>_<columna>` | `idx_users_email` |
| Foreign keys | `fk_<tabla>_<referencia>` | `fk_orders_user_id` |
| Secuencias | `seq_<tabla>` | `seq_users` |

## Reglas de los Changesets

- Cada changeset debe ser **atómico**: una sola operación lógica por changeset.
- Los changesets son **inmutables** una vez ejecutados en cualquier entorno. Nunca modificar un changeset ya aplicado; crear uno nuevo.
- Añadir `rollback` explícito cuando la operación no sea reversible automáticamente por Liquibase.
- Usar `preConditions` para evitar errores en re-ejecuciones si es necesario.

## Integración con Spring Boot

Configuración mínima en `application.yml`:

```yaml
spring:
  liquibase:
    change-log: classpath:db/changelog/db.changelog-master.yaml
    enabled: true
```

Para tests, usar una base de datos en memoria (H2) o Testcontainers con PostgreSQL.

## Buenas Prácticas

- Revisar siempre el SQL generado con `./mvnw liquibase:updateSQL` antes de aplicar en producción.
- Ejecutar `./mvnw liquibase:validate` en el pipeline de CI para detectar errores de configuración.
- No mezclar migraciones de esquema con inserciones de datos de negocio en el mismo changeset.
- Documentar el propósito del changeset con un comentario si la operación no es autoexplicativa.

## Comandos Habituales

```bash
./mvnw liquibase:update        # Aplicar migraciones pendientes
./mvnw liquibase:status        # Ver changesets pendientes de aplicar
./mvnw liquibase:validate      # Validar la configuración de Liquibase
./mvnw liquibase:updateSQL     # Generar el SQL sin ejecutarlo
./mvnw liquibase:rollback -Dliquibase.rollbackCount=1  # Revertir último changeset
```
