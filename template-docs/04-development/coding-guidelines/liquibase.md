# Reglas de Codificación — Liquibase

Directrices para la gestión de migraciones de base de datos con Liquibase.

## General

- **Liquibase** gestiona todas las migraciones del esquema de base de datos. Ver tecnología de referencia en [technologies.md](../../01-introduction/technologies.md).
- Nunca usar `spring.jpa.hibernate.ddl-auto: create`, `update` o `create-drop` en entornos que no sean de prueba local.
- Los ficheros de migración se ubican en `template/template/domain/src/main/resources/db/changelog/`.

## Estructura de Ficheros

Changesets organizados en carpetas por versión dentro de `migrations/`:

```
src/main/resources/db/
└── changelog/
    ├── db.changelog-master.xml
    ├── migrations/
    │   ├── v1.0.0/
    │   ├── v1.1.0/
    │   └── v2.0.0/
    └── data/
        └── v1.0.0/
```

## Formato de Changesets

- Formato **XML**.
- Identificador: `<fecha>-<descripcion-kebab-case>`.
- Incluir siempre `author`, `id` y `labels` (versión de la aplicación).
- Estructura obligatoria: `<comment>`, `<preConditions>`, operación, `<rollback>`.

Ejemplo completo:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
        http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-4.20.xsd">

    <changeSet id="20240101-create-user" author="template" labels="v1.0.0">

        <comment>Creación de la tabla de usuarios del sistema</comment>

        <preConditions onFail="MARK_RAN">
            <not>
                <tableExists tableName="user"/>
            </not>
        </preConditions>

        <createTable tableName="user">
            <column name="id" type="BIGINT">
                <constraints primaryKey="true" nullable="false"/>
            </column>
            <column name="username" type="VARCHAR(100)">
                <constraints nullable="false" unique="true"/>
            </column>
            <column name="email" type="VARCHAR(255)">
                <constraints nullable="false" unique="true"/>
            </column>
            <column name="active" type="BOOLEAN" defaultValueBoolean="true">
                <constraints nullable="false"/>
            </column>
            <column name="created_at" type="TIMESTAMP" defaultValueComputed="CURRENT_TIMESTAMP">
                <constraints nullable="false"/>
            </column>
        </createTable>

        <createSequence sequenceName="user_SEQ" startValue="1" incrementBy="50"/>

        <rollback>
            <dropSequence sequenceName="user_SEQ"/>
            <dropTable tableName="user"/>
        </rollback>

    </changeSet>

</databaseChangeLog>
```

## Convenciones de Nomenclatura

| Elemento           | Convención                       | Ejemplo                          |
|--------------------|----------------------------------|----------------------------------|
| Ficheros           | `YYYYMMDD-descripcion-kebab.xml` | `20240101-create-user-table.xml` |
| Tablas             | snake_case, singular             | `user`, `order_item`             |
| Tablas intermedias | `<entidad1>2<entidad2>`          | `profile2action`                 |
| Columnas           | snake_case, singular             | `created_at`, `username`         |
| Columnas FK        | `<referencia>_fk` (nunca `_id`)  | `user_fk`, `profile_fk`          |
| Índices            | `idx_<tabla>_<columna>`          | `idx_user_email`                 |
| Foreign keys       | `<tabla>_<referencia>_FK`        | `order_user_id_FK`               |
| Secuencias         | `<tabla>_SEQ`                    | `user_SEQ`                       |

## Esquema y Tablespaces

Todos los objetos se crean en el esquema `template`. Su ubicación física se parametriza con propiedades de Liquibase definidas en `db.changelog-master.xml`:

| Propiedad         | Valor por defecto    | Uso                                   |
|-------------------|----------------------|---------------------------------------|
| `schemaName`      | `template`           | Esquema de tablas, secuencias e índices |
| `tablespaceData`  | `template_data_tbs`  | Tablespace de las tablas              |
| `tablespaceIndex` | `template_index_tbs` | Tablespace de índices, PK y UK        |

| Objeto     | Atributos obligatorios                                                                 |
|------------|----------------------------------------------------------------------------------------|
| Tabla      | `schemaName="${schemaName}" tablespace="${tablespaceData}"`                            |
| Secuencia  | `schemaName="${schemaName}"` (PostgreSQL no admite tablespace en secuencias)           |
| Índice     | `schemaName="${schemaName}" tablespace="${tablespaceIndex}"`                           |
| PK         | `primaryKeyTablespace="${tablespaceIndex}"` (inline) o `tablespace` en `addPrimaryKey` |
| UK         | `addUniqueConstraint` con `tablespace="${tablespaceIndex}"` (no usar `unique="true"` inline) |
| FK         | `baseTableSchemaName` y `referencedTableSchemaName` con `${schemaName}`                |

- El esquema y los tablespaces deben existir antes de ejecutar Liquibase (ver `template-docker/postgres/init.sql`).
- `spring.liquibase.default-schema` y `hibernate.default_schema` apuntan a `template`, de modo que las semillas SQL y las entidades JPA no necesitan cualificar el esquema.
- Las consultas nativas deben usar `{h-schema}` delante del nombre de tabla.

## Reglas de los Changesets

- Cada changeset debe ser atómico.
- Inmutables una vez ejecutados. Nunca modificar un changeset ya aplicado.
- `<rollback>` explícito cuando la operación no sea reversible automáticamente.

## Comandos Habituales

```bash
./mvnw liquibase:update        # Aplicar migraciones pendientes
./mvnw liquibase:status        # Ver changesets pendientes
./mvnw liquibase:validate      # Validar configuración
./mvnw liquibase:updateSQL     # Generar SQL sin ejecutarlo
./mvnw liquibase:rollback -Dliquibase.rollbackCount=1  # Revertir último changeset
```
