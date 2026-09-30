# Reglas de Codificación — Liquibase

Aplica a migraciones y esquemas de base de datos (`**/db/changelog/**/*.xml`).

## Principios y Convenciones

- Cada cambio de base de datos se realiza mediante changelogs XML versionados en Liquibase.
- Nomenclatura ordenada y descriptiva para los IDs de `changeSet` y nombres de fichero.
- Los changeSets deben ser atómicos, idempotentes y contar con mecanismos de rollback cuando proceda.
- Nunca modificar changelogs ya ejecutados en entornos compartidos; crear nuevos changeSets incrementales.
- Sigue la guía oficial: [template-docs/04-development/coding-guidelines/liquibase.md](file:///Users/ijgomez/Documents/workspace/template/template-docs/04-development/coding-guidelines/liquibase.md).
