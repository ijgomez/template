# Entornos y Perfiles

## Introducción

El proyecto Template define un conjunto de perfiles de compilación que gobiernan tanto el backend (Maven) como el frontend (Angular). Ambos deben estar alineados para garantizar la coherencia de la configuración.

---

## Perfiles de compilación

| Perfil  | Entorno(s) que cubre                    | Descripción                                                                              |
|---------|-----------------------------------------|------------------------------------------------------------------------------------------|
| `local` | Local                                   | Configuración para desarrollo local (BD local, logs en DEBUG, etc.)                      |
| `dist`  | Desarrollo, Integración, QA, Producción | Compilación para distribución. La configuración se externaliza en `template-properties`. |
| `test`  | —                                       | Ejecuta los tests (unitarios e integración). Activa JaCoCo y SonarQube.                  |

---

## Configuración por componente

### Backend (Maven)

Los perfiles se activan con la opción `-P`:

```bash
mvn clean install -Plocal     # Desarrollo local
mvn clean install -Pdist      # Distribución
mvn clean install -Ptest      # Testing con JaCoCo
```

La configuración por entorno se gestiona mediante ficheros `application-<perfil>.yml` en el módulo `webapp`.

### Frontend (Angular)

Las configuraciones de build se especifican con `--configuration`:

```bash
ng serve --configuration=local   # Desarrollo local (por defecto)
ng build --configuration=dist    # Distribución (por defecto)
ng build --configuration=test    # Testing
```

Cada configuración tiene un fichero de entorno asociado:

| Configuración | Fichero                                |
|---------------|----------------------------------------|
| `local`       | `src/environments/environment.ts`      |
| `dist`        | `src/environments/environment.dist.ts` |
| `test`        | `src/environments/environment.test.ts` |

### Base de datos (Liquibase)

Las migraciones se ejecutan con el perfil correspondiente:

```bash
cd template/domain
mvn liquibase:update -Plocal
```

---

## Regla de alineación

> **Los perfiles Maven y las configuraciones Angular deben estar siempre sincronizados.**
>
> Si se añade un nuevo perfil Maven, se debe crear el fichero de entorno Angular correspondiente (`environment.<perfil>.ts`) y la configuración asociada en `angular.json`.
>
> Del mismo modo, si se elimina un perfil Maven, se debe eliminar el fichero de entorno y la configuración Angular correspondientes.

Esta regla garantiza que cualquier entorno de despliegue tenga una representación coherente tanto en backend como en frontend.

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
