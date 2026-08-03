# Conventions

## Naming

- Directory/module names: **kebab-case** (`template-dashboard`, `template-liquibase`).
- Java packages: `org.myorganization.template.<module>` (e.g. `...template.commons`, `...template.domain`).
- Maven artifacts: `template-<module>` (e.g. `template-commons`, `template-core`).

## Java / Backend

- No Spring dependencies in `domain` module (pure Java + Jakarta Persistence only).
- No business logic in `webapp`; delegate to `core`.
- Unit tests: `*Test.java` / `*Tests.java`; property-based: `*Properties.java`.
- Integration tests: `*IT.java` (run by Failsafe plugin under `test` profile).
- Assertions with AssertJ; mocking with Mockito; property-based testing with jqwik.

## Frontend (Angular)

- Indent: 2 spaces (editorconfig).
- Prettier: printWidth 100, singleQuote, angular parser for HTML.
- TypeScript: single quotes enforced.
- Testing: Vitest + fast-check (property-based).
- i18n via ngx-translate (JSON translation files).

## Liquibase

- Changelogs in **XML** format only.
- Maintained in separate module `template-liquibase`.

## Version Control

- Branching: GitFlow (`master` for stable, `release/*` for candidates).
- Versioning: SemVer (MAJOR.MINOR.PATCH). Current: `0.1.0-SNAPSHOT`.
- Sensitive properties never committed; use `template-properties` for templates only.

## Encoding

- UTF-8 everywhere (source, resources, properties).
