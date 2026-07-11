# Stack Tecnológico

## Configuración de Control de Versiones

- **Control de versiones:** Git con Git LFS habilitado
- **Ramas:** `master` (rama principal), `release/2.0` (rama de release)
- **Remoto:** GitHub (`https://github.com/ijgomez/template`)

## Stack Tecnológico

### Backend
- **Java 21**
- **Spring Boot 4.1.0**

### Base de Datos
- **PostgreSQL 18**
- **Liquibase** (gestión de migraciones y cambios del modelo de datos)

### Frontend
- **Angular 22**
- **Bootstrap 5.3.8** (framework de estilos CSS)

## Sistema de Build

- **Backend:** Maven
- **Frontend:** npm / Angular CLI (`ng`)

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
