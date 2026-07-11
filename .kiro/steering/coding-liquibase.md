# Reglas de Codificación — Liquibase

## General

- **Liquibase** gestiona todas las migraciones del esquema de base de datos (**PostgreSQL 18**).
- Nunca usar `spring.jpa.hibernate.ddl-auto: create`, `update` o `create-drop` en entornos que no sean de prueba local. El esquema lo controla Liquibase exclusivamente.
- Los ficheros de migración se ubican en el módulo `template-liquibase`, en `src/main/resources/db/changelog/`.

## Estructura de Ficheros

```
src/main/resources/db/
└── changelog/
    ├── db.changelog-master.xml         # Fichero raíz que incluye los demás
    ├── migrations/
    │   ├── 20240101-create-user-table.xml
    │   ├── 20240115-add-email-index.xml
    │   └── ...
    └── data/
        └── 20240101-initial-data.xml   # Datos iniciales / semilla (opcional)
```

- El fichero `db.changelog-master.xml` solo contiene elementos `<include>` o `<includeAll>`, nunca changesets directamente.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
        http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-latest.xsd">

    <includeAll path="db/changelog/migrations/" relativeToChangelogFile="false"/>

</databaseChangeLog>
```

## Formato de Changesets

- Usar formato **XML** como estándar del proyecto.
- Identificador del changeset: `<fecha>-<descripcion-kebab-case>`.
- Incluir siempre `author` e `id`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
        http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-latest.xsd">

    <changeSet id="20240101-create-user-table" author="javier.izquierdo">
        <createTable tableName="users">
            <column name="id" type="BIGINT" autoIncrement="true">
                <constraints primaryKey="true" nullable="false"/>
            </column>
            <column name="email" type="VARCHAR(255)">
                <constraints nullable="false" unique="true"/>
            </column>
            <column name="name" type="VARCHAR(255)">
                <constraints nullable="false"/>
            </column>
            <column name="created_at" type="TIMESTAMP" defaultValueComputed="CURRENT_TIMESTAMP">
                <constraints nullable="false"/>
            </column>
        </createTable>
    </changeSet>

</databaseChangeLog>
```

## Convenciones de Nomenclatura

| Elemento     | Convención                       | Ejemplo                          |
|--------------|----------------------------------|----------------------------------|
| Ficheros     | `YYYYMMDD-descripcion-kebab.xml` | `20240101-create-user-table.xml` |
| Tablas       | snake_case, plural               | `users`, `order_items`           |
| Columnas     | snake_case                       | `created_at`, `user_id`          |
| Índices      | `idx_<tabla>_<columna>`          | `idx_users_email`                |
| Foreign keys | `fk_<tabla>_<referencia>`        | `fk_orders_user_id`              |
| Secuencias   | `seq_<tabla>`                    | `seq_users`                      |

## Reglas de los Changesets

- Cada changeset debe ser **atómico**: una sola operación lógica por changeset.
- Los changesets son **inmutables** una vez ejecutados en cualquier entorno. Nunca modificar un changeset ya aplicado; crear uno nuevo.
- Añadir `<rollback>` explícito cuando la operación no sea reversible automáticamente por Liquibase.
- Usar `<preConditions>` para evitar errores en re-ejecuciones si es necesario.

```xml
<changeSet id="20240115-add-email-index" author="javier.izquierdo">
    <createIndex tableName="users" indexName="idx_users_email">
        <column name="email"/>
    </createIndex>
    <rollback>
        <dropIndex tableName="users" indexName="idx_users_email"/>
    </rollback>
</changeSet>
```

## Integración con Spring Boot

Configuración mínima en `application.yml`:

```yaml
spring:
  liquibase:
    change-log: classpath:db/changelog/db.changelog-master.xml
    enabled: true
```

Para tests, usar una base de datos en memoria (H2) o Testcontainers con PostgreSQL.

## Buenas Prácticas

- Revisar siempre el SQL generado con `./mvnw liquibase:updateSQL` antes de aplicar en producción.
- Ejecutar `./mvnw liquibase:validate` en el pipeline de CI para detectar errores de configuración.
- No mezclar migraciones de esquema con inserciones de datos de negocio en el mismo changeset.
- Documentar el propósito del changeset con un comentario XML si la operación no es autoexplicativa.

## Comandos Habituales

```bash
./mvnw liquibase:update        # Aplicar migraciones pendientes
./mvnw liquibase:status        # Ver changesets pendientes de aplicar
./mvnw liquibase:validate      # Validar la configuración de Liquibase
./mvnw liquibase:updateSQL     # Generar el SQL sin ejecutarlo
./mvnw liquibase:rollback -Dliquibase.rollbackCount=1  # Revertir último changeset
```
