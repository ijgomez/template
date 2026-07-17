# Tecnologías utilizadas

## Introducción

Template está construido utilizando tecnologías ampliamente adoptadas en el desarrollo de aplicaciones empresariales, priorizando la estabilidad, la mantenibilidad y la escalabilidad.

La selección tecnológica busca proporcionar una plataforma moderna y robusta, capaz de servir como base para el desarrollo de nuevas aplicaciones corporativas.

---

# Arquitectura tecnológica

La plataforma está compuesta por las siguientes capas tecnológicas:

| Capa          | Tecnologías                    |
|---------------|--------------------------------|
| Frontend      | Angular, TypeScript, Bootstrap |
| Backend       | Java, Spring Boot              |
| Persistencia  | JPA, Hibernate                 |
| Base de datos | PostgreSQL 18                  |
| Seguridad     | Spring Security, JWT           |
| Migraciones   | Liquibase                      |
| Construcción  | Maven, npm                     |
| Contenedores  | Docker                         |
| Documentación | Markdown, Mermaid              |

---

# Backend

El backend está desarrollado sobre la plataforma Java utilizando Spring Boot como framework principal.

| Tecnología       | Descripción                                                |
|------------------|------------------------------------------------------------|
| Java             | Lenguaje de programación principal                         |
| Spring Boot      | Framework para el desarrollo de aplicaciones empresariales |
| Spring Framework | Inyección de dependencias, configuración y servicios       |
| Spring Security  | Gestión de autenticación y autorización                    |
| Spring Data JPA  | Acceso a datos                                             |
| Hibernate        | Implementación JPA                                         |
| MapStruct        | Conversión entre entidades y DTO                           |
| Jackson          | Serialización y deserialización JSON                       |
| Maven            | Gestión de dependencias y construcción del proyecto        |

---

# Frontend

El frontend se desarrolla como una Single Page Application (SPA) utilizando Angular.

| Tecnología             | Descripción                              |
|------------------------|------------------------------------------|
| Angular                | Framework frontend                       |
| TypeScript             | Lenguaje de programación                 |
| Bootstrap              | Componentes visuales y diseño responsive |
| HTML5                  | Estructura de la interfaz                |
| CSS3                   | Estilos                                  |
| RxJS                   | Programación reactiva                    |
| Angular Router         | Navegación                               |
| Angular Service Worker | Funcionalidades PWA                      |

---

# Base de datos

La plataforma utiliza bases de datos relacionales.

La base de datos de referencia es PostgreSQL, aunque la arquitectura permite trabajar con otros motores compatibles con JPA.

| Tecnología | Descripción                             |
|------------|-----------------------------------------|
| PostgreSQL 18 | Base de datos de referencia          |
| JPA        | API de persistencia                     |
| Hibernate  | ORM                                     |
| Liquibase  | Versionado del esquema de base de datos |

---

# Seguridad

La plataforma incorpora un modelo de seguridad basado en estándares ampliamente utilizados.

| Tecnología      | Descripción                   |
|-----------------|-------------------------------|
| Spring Security | Framework de seguridad        |
| JWT             | Autenticación mediante tokens |
| HTTPS           | Comunicación segura           |
| BCrypt          | Cifrado de contraseñas        |

---

# API's e integración

La comunicación entre el frontend y el backend se realiza mediante servicios REST.

Las principales tecnologías utilizadas son:

| Tecnología | Descripción                           |
|------------|---------------------------------------|
| REST       | Comunicación entre aplicaciones       |
| JSON       | Formato de intercambio de información |
| HTTP/HTTPS | Protocolo de comunicación             |

La arquitectura permite integrar fácilmente nuevos servicios corporativos y aplicaciones externas.

---

# Herramientas de desarrollo

Durante el desarrollo del proyecto se utilizan distintas herramientas para facilitar la construcción, pruebas y mantenimiento.

| Tecnología | Descripción                              |
|------------|------------------------------------------|
| Maven      | Construcción del backend                 |
| npm        | Gestión de paquetes frontend             |
| Git        | Control de versiones                     |
| Docker     | Contenedorización                        |
| Markdown   | Documentación                            |
| Mermaid    | Diagramas integrados en la documentación |

---

# Compatibilidad

Template ha sido diseñado para ejecutarse sobre plataformas modernas y ampliamente soportadas.

| Elemento                 | Tecnología                                         |
|--------------------------|----------------------------------------------------|
| JDK                      | Java 21 o superior                                 |
| Servidor de aplicaciones | Apache Tomcat                                      |
| Navegador                | Chrome, Edge, Firefox y otros navegadores modernos |
| Sistema operativo        | Windows, Linux y macOS (desarrollo)                |

---

# Tecnologías opcionales

Dependiendo de las necesidades de cada proyecto, la plataforma puede integrarse con tecnologías adicionales como:

- LDAP / Active Directory.
- Servidores SMTP.
- OAuth2 / OpenID Connect.
- Sistemas de monitorización.
- API's REST de terceros.

Estas integraciones no forman parte del núcleo de la plataforma y pueden incorporarse según los requisitos de cada proyecto.

---

# Resumen

Template utiliza un conjunto de tecnologías consolidadas y ampliamente adoptadas en el ámbito empresarial, proporcionando una base sólida para el desarrollo de aplicaciones modernas.

La combinación de Spring Boot, Angular, PostgreSQL y Liquibase permite construir aplicaciones seguras, escalables y mantenibles, mientras que el uso de estándares abiertos facilita la integración con otros sistemas y la evolución de la plataforma a largo plazo.