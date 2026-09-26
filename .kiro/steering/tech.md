# Stack Tecnológico

#[[file:template-docs/01-introduction/technologies.md]]

## Configuración de Control de Versiones

- **Control de versiones:** Git con Git LFS habilitado
- **Remoto:** GitHub (`https://github.com/ijgomez/template`)
- **Estrategia de branching:** GitFlow
- **Versionado:** SemVer (MAJOR.MINOR.PATCH)
- **Detalle completo:** ver `template-docs/04-development/version-control.md`

## Versiones Específicas

Ver la tabla de versiones de referencia (Java, Spring Boot, PostgreSQL, Angular, Bootstrap) en `template-docs/01-introduction/technologies.md`, incluido arriba. Es la fuente única de verdad.

## Comandos Habituales

### Backend (Maven)
```bash
mvn clean install        # Compilar y empaquetar
mvn spring-boot:run      # Arrancar la aplicación
mvn test                 # Ejecutar tests
mvn clean package        # Generar el artefacto desplegable
```

### Frontend (Angular CLI)
```bash
npm install              # Instalar dependencias
ng serve                 # Arrancar en modo desarrollo
ng build                 # Compilar para producción
ng test                  # Ejecutar tests
```
