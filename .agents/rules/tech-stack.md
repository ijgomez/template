# Stack Tecnológico y Comandos

Información de referencia sobre versiones, tecnologías y comandos habituales de desarrollo.

## Stack Tecnológico

- **Backend:** Java 21 LTS, Spring Boot 4.1.1, Spring Data JPA, Spring Security, Liquibase, MapStruct, Lombok.
- **Frontend:** Angular 19+, TypeScript, RxJS, Bootstrap / Angular Material.
- **Base de datos:** PostgreSQL.
- **Testing:** JUnit 5, Mockito, AssertJ, Testcontainers, Playwright.
- **Construcción y empaquetado:** Maven (Backend), Angular CLI / npm (Frontend).
- **Control de versiones:** Git con Git LFS, GitHub Flow / GitFlow, SemVer.
- Documentación completa de versiones: [template-docs/01-introduction/technologies.md](file:///Users/ijgomez/Documents/workspace/template/template-docs/01-introduction/technologies.md).

## Comandos Habituales

### Backend (Maven)
```bash
mvn clean install        # Compilar y empaquetar
mvn spring-boot:run      # Arrancar la aplicación
mvn test                 # Ejecutar tests
mvn clean package        # Generar artefacto desplegable
```

### Frontend (Angular CLI / npm)
```bash
npm install              # Instalar dependencias
ng serve                 # Arrancar en modo desarrollo
ng build                 # Compilar para producción
ng test                  # Ejecutar tests
```
