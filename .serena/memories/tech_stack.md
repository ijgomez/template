# Tech Stack

## Backend

| Component        | Version / Detail                     |
|------------------|--------------------------------------|
| Java             | 21 (`maven.compiler.release=21`)     |
| Spring Boot      | 4.1.1 (parent POM)                  |
| PostgreSQL       | driver 42.7.5; server target: 18    |
| Liquibase        | 4.31.1                               |
| JWT              | JJWT 0.12.6                         |
| Jakarta Persist. | 3.2.0                                |
| Build            | Maven (multi-module, WAR)           |
| Packaging        | WAR via `webapp` module              |

### Testing (backend)

- JUnit 5, Mockito, AssertJ (all managed by Spring Boot parent)
- jqwik 1.9.2 (property-based)
- Testcontainers 1.21.4 (PostgreSQL)
- JaCoCo 0.8.12
- SonarQube plugin 4.0.0.4121

## Frontend

| Component        | Version / Detail                     |
|------------------|--------------------------------------|
| Angular          | 22                                   |
| TypeScript       | ~6.0.2                               |
| Bootstrap        | ^5.3.8                               |
| bootstrap-icons  | ^1.11.3                              |
| ngx-translate    | 18                                   |
| Node             | v22.22.3 (installed by frontend-maven-plugin) |
| npm              | 12.0.1 (packageManager field)        |
| Prettier         | ^3.8.1                               |

### Testing (frontend)

- Vitest 4.0.8
- fast-check ^4.9.0 (property-based)
- jsdom ^28.0.0

## Infrastructure

- Docker (docker-compose in `template-docker/`)
- Nginx reverse proxy (frontend)
- Separate Dockerfiles for backend and frontend

## Maven Profiles

| Profile | Purpose                                              |
|---------|------------------------------------------------------|
| `local` | Dev machine (active by default); `spring.profiles.active=local` |
| `dist`  | Distribution builds (dev/int/qa/pro); config externalized |
| `test`  | Enables JaCoCo + Failsafe integration tests          |
