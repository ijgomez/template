# Task Completion Checklist

Commands to run when a coding task is considered done.

## Backend changes (any module under `template/`)

```bash
# From template/ directory:
mvn clean test                           # unit tests must pass
mvn verify -P test                       # integration tests + coverage (if IT tests exist)
```

## Frontend changes (`template/dashboard/`)

```bash
# From template/dashboard/ directory:
npx prettier --check src/               # formatting must pass
npx vitest --run                         # all tests must pass
ng build                                 # production build must succeed
```

## Liquibase changes (`domain/src/main/resources/db/changelog/**`)

```bash
# From template/ directory:
mvn clean install -pl domain                  # changelogs packaged into domain artifact
mvn liquibase:update -pl domain               # (optional) apply migrations manually via plugin
mvn verify -P test -pl webapp                 # webapp IT applies migrations — validates schema
```

## Full verification (before commit)

```bash
# Backend (from template/)
mvn clean verify -P test

# Frontend (from template/dashboard/)
npx prettier --check src/ && npx vitest --run && ng build
```

## Notes

- Never skip tests (`-DskipTests`) for final verification.
- JaCoCo report generated under `target/site/jacoco/` when using `-P test`.
- Integration tests require Docker (Testcontainers uses PostgreSQL container).
