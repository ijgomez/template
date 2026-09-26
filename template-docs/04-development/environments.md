# Entornos y Perfiles

## Introducción

El proyecto Template define un conjunto de entornos de ejecución y de perfiles de compilación que gobiernan tanto el backend (Maven) como el frontend (Angular). Este documento describe **qué** entornos y perfiles existen y cómo se relacionan.

Para los **comandos** de compilación y arranque con cada perfil, consultar la guía de [construcción y arranque](build.md).

---

## Perfiles de compilación

| Perfil  | Entorno(s) que cubre                    | Descripción                                                                              |
|---------|-----------------------------------------|------------------------------------------------------------------------------------------|
| `local` | Local                                   | Configuración para desarrollo local (BD local, logs en DEBUG, etc.)                      |
| `dist`  | Desarrollo, Integración, QA, Producción | Compilación para distribución. La configuración se externaliza en `template-properties`. |
| `test`  | —                                       | Ejecuta los tests (unitarios e integración). Activa JaCoCo y SonarQube.                  |

---

## Entornos de ejecución

Los perfiles `local` y `dist` cubren los siguientes entornos de ejecución:

| Entorno       | Código  | Perfil utilizado | Descripción                                        |
|---------------|---------|------------------|----------------------------------------------------|
| Local         | `local` | `local`          | Máquina del desarrollador                          |
| Desarrollo    | `dev`   | `dist`           | Entorno compartido de desarrollo                   |
| Integración   | `int`   | `dist`           | Entorno de integración continua                    |
| QA            | `qa`    | `dist`           | Entorno de pruebas de calidad / aceptación         |
| Producción    | `pro`   | `dist`           | Entorno productivo                                 |

En el perfil `dist`, la configuración específica de cada entorno (URL de BD, JWT secret, etc.) se externaliza en el proyecto `template-properties`, no en los artefactos compilados.

---

## Ficheros de configuración por componente

Cada perfil tiene una representación de configuración en backend y frontend:

| Perfil / Configuración | Backend (Maven)                            | Frontend (Angular)                     |
|------------------------|--------------------------------------------|----------------------------------------|
| `local`                | `application-local.yml` (en `webapp`)      | `src/environments/environment.ts`      |
| `dist`                 | `application-dist.yml` (en `webapp`)       | `src/environments/environment.dist.ts` |
| `test`                 | `application-test.yml` (en `webapp`)       | `src/environments/environment.test.ts` |

La configuración por entorno del backend se gestiona mediante ficheros `application-<perfil>.yml` en el módulo `webapp`.

---

## Regla de alineación

> **Los perfiles Maven y las configuraciones Angular deben estar siempre sincronizados.**
>
> Si se añade un nuevo perfil Maven, se debe crear el fichero de entorno Angular correspondiente (`environment.<perfil>.ts`) y la configuración asociada en `angular.json`.
>
> Del mismo modo, si se elimina un perfil Maven, se debe eliminar el fichero de entorno y la configuración Angular correspondientes.

Esta regla garantiza que cualquier entorno de despliegue tenga una representación coherente tanto en backend como en frontend.

---

## Siguiente paso

Para compilar y arrancar el proyecto con cada perfil, consultar la guía de [construcción y arranque](build.md).
