# Stack Tecnológico

## Configuración de Control de Versiones

- **Control de versiones:** Git con Git LFS habilitado
- **Ramas:** `master` (rama principal), `release/2.0` (rama de release)
- **Remoto:** GitHub (`https://github.com/ijgomez/template`)

## Stack Tecnológico

### Backend
- **Java 21**
- **Spring Boot 4.1.0**
- **Lombok** (reducción de código repetitivo: constructores, getters, builders, etc.)
- **Log4j2** (framework de logging)
- **JaCoCo** (cobertura de tests)
- **SonarQube** (análisis de calidad del código)

### Modos de Despliegue

La aplicación está diseñada para ejecutarse en dos modos:

- **Microservicio** (JAR ejecutable): empaquetado como JAR con servidor embebido, arranca de forma autónoma.
- **Aplicación web** (WAR desplegable): empaquetado como WAR para desplegar en un servidor de aplicaciones externo.

Servidores web soportados:
- **Apache Tomcat**
- **WildFly**

### Base de Datos
- **PostgreSQL 18**
- **Liquibase** (gestión de migraciones y cambios del modelo de datos)
- **Spring Data JPA** (acceso y operaciones de base de datos)

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
