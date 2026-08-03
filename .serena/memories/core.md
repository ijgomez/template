# Project: template

Enterprise application template — monorepo with Java backend + Angular frontend.

## Repository Layout

```
template/                   # workspace root
├── template/               # Maven multi-module parent (groupId: org.myorganization.template)
│   ├── commons/            # shared utilities, base classes
│   ├── cluster/            # cluster-aware abstractions (depends on commons)
│   ├── domain/             # JPA entities, pure Java (depends on cluster, commons)
│   ├── core/               # business logic, Spring services (depends on domain)
│   └── webapp/             # REST API, security, Spring Boot app — WAR (depends on core)
├── template-dashboard/     # Angular 22 SPA (standalone project, npm)
├── template-liquibase/     # DB migration changelogs (XML format)
├── template-docker/        # Dockerfiles + docker-compose
├── template-dist/          # deployment scripts (linux/windows)
└── template-docs/          # project documentation (markdown)
```

## Module Dependency Chain

commons → cluster → domain → core → webapp

## Key Invariants

- `domain` must stay Spring-free (only Jakarta Persistence allowed).
- Business logic lives in `core`, never in `webapp`.
- Frontend is built by `frontend-maven-plugin` inside `webapp/pom.xml`; output copied to WAR static resources.
- Liquibase changelogs are XML only, packaged as a separate Maven artifact consumed by `webapp`.
- WAR packaging (not JAR).

## Cross-references

- Tech stack details: `mem:tech_stack`
- Build/test/run commands: `mem:suggested_commands`
- Code style and naming: `mem:conventions`
- CI verification steps: `mem:task_completion`
