# Suggested Commands

All paths relative to workspace root.

## Backend (Maven)

```bash
# Full build (from template/)
mvn clean install                        # compile + test + package all modules
mvn clean install -DskipTests            # skip tests for faster iteration

# Run the app locally
mvn spring-boot:run -pl webapp           # starts webapp module (profile local active by default)

# Run tests only
mvn test                                 # unit tests (Surefire)
mvn verify -P test                       # unit + integration tests + JaCoCo

# Single module
mvn test -pl core                        # test only core module
mvn test -pl domain                      # test only domain module

# Package for distribution
mvn clean package -P dist -DskipTests    # WAR for deployment
```

Working directory for all Maven commands: `template/`

## Frontend (Angular)

```bash
# Dev server
ng serve                                 # http://localhost:4200
npm start                                # alias for ng serve

# Build
ng build                                 # production build
ng build --configuration=local           # local config

# Tests
npx vitest --run                         # single run (no watch)
npx vitest                               # watch mode (interactive)

# Format
npx prettier --write src/                # format all sources
npx prettier --check src/                # check formatting
```

Working directory for all frontend commands: `template-dashboard/`

## Docker

```bash
docker compose up -d                     # start all services
docker compose down                      # stop all services
docker compose up -d postgres            # only the DB
```

Working directory: `template-docker/`

## Darwin/macOS Notes

- `sed` is BSD sed; use `sed -i ''` (not `sed -i`).
- `grep -P` (Perl regex) not available; use `grep -E` or install `ggrep`.
- `readlink -f` not available natively; use `greadlink -f` (from coreutils) if needed.
