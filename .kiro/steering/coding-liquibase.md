# Reglas de Codificación — Liquibase

## General

- **Liquibase** gestiona todas las migraciones del esquema de base de datos (**PostgreSQL 18**).
- Nunca usar `spring.jpa.hibernate.ddl-auto: create`, `update` o `create-drop` en entornos que no sean de prueba local. El esquema lo controla Liquibase exclusivamente.
- Los ficheros de migración se ubican en el módulo `template-liquibase`, en `src/main/resources/db/changelog/`.

## Estructura de Ficheros

Los changesets se organizan en **carpetas por versión** dentro de `migrations/`. Cada versión de la aplicación tiene su propio directorio, lo que permite trazar qué cambios de base de datos pertenecen a cada release.

```
src/main/resources/db/
└── changelog/
    ├── db.changelog-master.xml         # Fichero raíz que incluye los demás
    ├── migrations/
    │   ├── v1.0.0/
    │   │   ├── 20240101-create-user-table.xml
    │   │   └── 20240115-add-email-index.xml
    │   ├── v1.1.0/
    │   │   └── 20240301-add-phone-column.xml
    │   └── v2.0.0/
    │       └── 20240601-create-order-table.xml
    └── data/
        └── v1.0.0/
            └── 20240101-initial-data.xml   # Datos iniciales / semilla (opcional)
```

- El fichero `db.changelog-master.xml` solo contiene elementos `<include>` o `<includeAll>`, nunca changesets directamente.
- Añadir un nuevo `<includeAll>` por cada versión, en orden ascendente. Nunca reordenar los existentes.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
        http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-latest.xsd">

    <includeAll path="db/changelog/migrations/v1.0.0/" relativeToChangelogFile="false"/>
    <includeAll path="db/changelog/migrations/v1.1.0/" relativeToChangelogFile="false"/>
    <includeAll path="db/changelog/migrations/v2.0.0/" relativeToChangelogFile="false"/>

</databaseChangeLog>
```

## Formato de Changesets

- Usar formato **XML** como estándar del proyecto.
- Identificador del changeset: `<fecha>-<descripcion-kebab-case>`.
- Incluir siempre `author`, `id` y el atributo **`labels`** con la versión de la aplicación a la que pertenece el cambio:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
        http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-latest.xsd">

    <changeSet id="20240101-create-user-table" author="javier.izquierdo" labels="v1.0.0">

        <comment>Crea la tabla principal de usuarios del sistema.</comment>

        <preConditions onFail="MARK_RAN">
            <not>
                <tableExists tableName="user"/>
            </not>
        </preConditions>

        <createTable tableName="user">
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

        <rollback>
            <dropTable tableName="user"/>
        </rollback>

    </changeSet>

</databaseChangeLog>
```

### Asociación de Changesets a Versiones

Cada changeset se asocia a una versión de la aplicación mediante dos mecanismos complementarios:

1. **Carpeta de versión** — el fichero se ubica en `migrations/v<X.Y.Z>/`. Proporciona visibilidad inmediata en el explorador de ficheros y agrupa los cambios de cada release.

2. **Atributo `labels`** — el changeset lleva `labels="v<X.Y.Z>"`. Permite ejecutar selectivamente los changesets de una versión concreta, útil en pipelines de CI/CD o para migraciones incrementales:

```bash
# Aplicar solo los changesets de la versión 1.1.0
./mvnw liquibase:update -Dliquibase.labels="v1.1.0"

# Aplicar las versiones 1.0.0 y 1.1.0
./mvnw liquibase:update -Dliquibase.labels="v1.0.0 or v1.1.0"
```

Ambos mecanismos deben usarse siempre juntos: el changeset vive en la carpeta de su versión **y** lleva el `labels` correspondiente.

## Convenciones de Nomenclatura

| Elemento           | Convención                       | Ejemplo                          |
|---------------------|----------------------------------|----------------------------------|
| Ficheros            | `YYYYMMDD-descripcion-kebab.xml` | `20240101-create-user-table.xml` |
| Tablas              | snake_case, **singular**         | `user`, `order_item`             |
| Tablas intermedias  | `<entidad1>2<entidad2>`          | `profile2action`                 |
| Columnas            | snake_case, **singular**         | `created_at`, `user_id`          |
| Índices             | `idx_<tabla>_<columna>`          | `idx_user_email`                 |
| Foreign keys        | `<tabla>_<referencia>_FK`        | `order_user_id_FK`               |
| Secuencias          | `<tabla>_SEQ`                    | `user_SEQ`                       |

- Los nombres de tablas y columnas deben estar en **singular** (no en plural).
- Las tablas intermedias (join tables) de relaciones muchos-a-muchos siguen la convención `<entidad1>2<entidad2>` en snake_case (p. ej. `profile2action`).
- Todas las foreign keys **deben** terminar en `_FK`.
- Todas las secuencias **deben** terminar en `_SEQ`.

## Reglas de los Changesets

- Cada changeset debe ser **atómico**: una sola operación lógica por changeset.
- Los changesets son **inmutables** una vez ejecutados en cualquier entorno. Nunca modificar un changeset ya aplicado; crear uno nuevo.
- Añadir `<rollback>` explícito cuando la operación no sea reversible automáticamente por Liquibase.
- Todo changeset **debe** incluir:
  - Un **comentario** (`<comment>`) que describa el propósito del cambio.
  - Una **precondición** (`<preConditions>`) adecuada para evitar errores en re-ejecuciones.

La estructura mínima obligatoria de un changeset es:

```xml
<changeSet id="20240101-create-user-table" author="javier.izquierdo" labels="v1.0.0">

    <comment>Crea la tabla principal de usuarios del sistema.</comment>

    <preConditions onFail="MARK_RAN">
        <not>
            <tableExists tableName="user"/>
        </not>
    </preConditions>

    <createTable tableName="user">
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

    <rollback>
        <dropTable tableName="user"/>
    </rollback>

</changeSet>
```

El valor de `onFail` en `<preConditions>` depende del contexto:

| Valor        | Uso                                                                 |
|--------------|---------------------------------------------------------------------|
| `MARK_RAN`   | La operación ya existe; marcar el changeset como ejecutado y seguir |
| `HALT`       | Error crítico; detener la migración                                 |
| `CONTINUE`   | Ignorar y continuar con el siguiente changeset                      |

Ejemplos de precondiciones habituales:

```xml
<!-- Para crear una tabla -->
<preConditions onFail="MARK_RAN">
    <not><tableExists tableName="user"/></not>
</preConditions>

<!-- Para añadir una columna -->
<preConditions onFail="MARK_RAN">
    <not><columnExists tableName="user" columnName="phone"/></not>
</preConditions>

<!-- Para crear un índice -->
<preConditions onFail="MARK_RAN">
    <not><indexExists indexName="idx_user_email"/></not>
</preConditions>

<!-- Para añadir una foreign key -->
<preConditions onFail="MARK_RAN">
    <not><foreignKeyConstraintExists foreignKeyName="order_user_id_FK"/></not>
</preConditions>
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
