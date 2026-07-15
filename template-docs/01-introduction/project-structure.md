# Estructura del proyecto

## Introducción

El proyecto **Template** está organizado como un conjunto de repositorios especializados que agrupan los distintos componentes de la plataforma.

Esta organización permite mantener separados los diferentes ámbitos de responsabilidad (backend, frontend, despliegue, base de datos y documentación), facilitando el mantenimiento, la evolución y la reutilización de cada uno de ellos.

La siguiente figura muestra la estructura general del proyecto.

```text
template/                          ← Raíz del workspace
├── template/                      ← Backend principal (multi-módulo Maven)
│   ├── pom.xml                    ← POM padre
│   ├── commons/                   ← Utilidades y librerías comunes
│   ├── cluster/                   ← Gestión del cluster y alta disponibilidad
│   ├── domain/                    ← Modelo de dominio (Entidades, DTO, VO)
│   ├── core/                      ← Servicios y lógica de negocio
│   └── webapp/                    ← API REST, seguridad y configuración
│
├── template-dashboard/            ← Frontend Angular
├── template-dist/                 ← Scripts de compilación y despliegue
├── template-docker/               ← Contenedores Docker y Docker Compose
├── template-liquibase/            ← Migraciones de base de datos
├── template-properties/           ← Configuración por entorno
└── template-docs/                 ← Documentación funcional y técnica
```

---

# Organización de los componentes

La plataforma se divide en varios componentes independientes, cada uno con una responsabilidad claramente definida.

## Backend (`template`)

Contiene toda la lógica de negocio de la aplicación.

Está organizado como un proyecto **Maven multi-módulo**, donde cada módulo implementa una responsabilidad concreta.

| Módulo  | Descripción                                                         |
|---------|---------------------------------------------------------------------|
| commons | Clases, utilidades y componentes reutilizables                      |
| cluster | Funcionalidades de alta disponibilidad y coordinación entre nodos   |
| domain  | Modelo de dominio, entidades JPA, DTO y objetos de transferencia    |
| core    | Servicios de negocio, repositorios, procesos y lógica de aplicación |
| webapp  | API REST, configuración de Spring Boot y seguridad                  |

---

## Frontend (`template-dashboard`)

Contiene la aplicación cliente desarrollada con **Angular**.

Es responsable de:

- Interfaz de usuario.
- Navegación.
- Internacionalización.
- Gestión del estado.
- Consumo de la API REST.
- Funcionalidades PWA.

El frontend puede evolucionar independientemente del backend siempre que se mantengan los contratos de la API.

---

## Base de datos (`template-liquibase`)

Este proyecto contiene la definición y evolución del modelo de datos.

Las modificaciones del esquema se gestionan mediante **Liquibase**, permitiendo:

- Versionar la base de datos.
- Automatizar migraciones.
- Mantener sincronizados todos los entornos.

---

## Configuración (`template-properties`)

Centraliza la configuración utilizada por los distintos entornos de ejecución.

Incluye, entre otros:

- Desarrollo.
- Integración.
- Preproducción.
- Producción.

Esta separación permite desacoplar la configuración del código fuente.

---

## Despliegue (`template-dist`)

Contiene los scripts necesarios para la construcción y despliegue de la plataforma.

Entre otras tareas:

- Compilación.
- Empaquetado.
- Publicación.
- Instalación.

Los scripts están organizados por sistema operativo cuando es necesario.

---

## Contenedores (`template-docker`)

Incluye la infraestructura necesaria para ejecutar la plataforma mediante Docker.

Puede contener, entre otros:

- Dockerfiles.
- Docker Compose.
- Configuración de redes.
- Volúmenes.

Su objetivo es facilitar la puesta en marcha de entornos locales y de integración.

---

## Documentación (`template-docs`)

Contiene toda la documentación funcional y técnica del proyecto.

La documentación está organizada en distintas secciones:

- Introducción.
- Arquitectura.
- Funcionalidades.
- Desarrollo.
- Especificación funcional.

---

## Asistentes IA (`.kiro`)

Este directorio contiene la configuración utilizada por herramientas de asistencia al desarrollo basadas en inteligencia artificial.

Su contenido no forma parte del funcionamiento de la aplicación, pero proporciona contexto y directrices para facilitar el desarrollo y mantenimiento del proyecto.

---

# Organización del repositorio

La separación del proyecto en varios componentes proporciona numerosas ventajas:

- Separación clara de responsabilidades.
- Independencia entre frontend y backend.
- Evolución independiente de cada componente.
- Reutilización entre proyectos.
- Facilidad de despliegue.
- Mantenimiento simplificado.

Esta organización constituye la estructura de referencia para todos los proyectos desarrollados a partir de Template.