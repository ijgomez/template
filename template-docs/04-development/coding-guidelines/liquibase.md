# Reglas de Codificación — Liquibase

Directrices para la gestión de migraciones de base de datos con Liquibase.

## General

- **Liquibase** gestiona todas las migraciones del esquema de base de datos (**PostgreSQL 18**).
- Nunca usar `spring.jpa.hibernate.ddl-auto: create`, `update` o `create-drop` en entornos que no sean de prueba local.
- Los ficheros de migración se ubican en `template-liquibase/src/main/resources/db/changelog/`.

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

## Convenciones de Nomenclatura

| Elemento           | Convención                       | Ejemplo                          |
|--------------------|----------------------------------|----------------------------------|
| Ficheros           | `YYYYMMDD-descripcion-kebab.xml` | `20240101-create-user-table.xml` |
| Tablas             | snake_case, singular             | `user`, `order_item`             |
| Tablas intermedias | `<entidad1>2<entidad2>`          | `profile2action`                 |
| Columnas           | snake_case, singular             | `created_at`, `user_id`          |
| Índices            | `idx_<tabla>_<columna>`          | `idx_user_email`                 |
| Foreign keys       | `<tabla>_<referencia>_FK`        | `order_user_id_FK`               |
| Secuencias         | `<tabla>_SEQ`                    | `user_SEQ`                       |

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
