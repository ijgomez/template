# Auditoría de seguridad integral de la aplicación

> Fase exclusivamente de auditoría (read-only). No se ha modificado ningún archivo del proyecto.
> Fecha: 2026-10-26

## 1. Resumen ejecutivo y valoración del riesgo global

**Valoración global: RIESGO ALTO.**

La base arquitectónica de seguridad es sólida: autenticación *stateless* con JWT HS256 (JJWT 0.12.6), refresh token opaco en base de datos con rotación y detección de reuso, cookie de refresh `HttpOnly`/`Secure`/`SameSite=Strict` con prefijo `__Host-`, access token **solo en memoria** en el frontend, BCrypt con *strength* 12, y ausencia de XSS y de inyección SQL en el código revisado. Sin embargo, existen **fallos de configuración confirmados que, combinados, permiten comprometer el sistema completo**:

1. Las **semillas de desarrollo** (usuario administrador con credenciales conocidas y acceso total) están declaradas con `context="local"` pero **no se filtra el contexto en el perfil de distribución**; Liquibase ejecuta changesets *con contexto* cuando no se especifica contexto en runtime. Sobre una base de datos nueva desplegada, se crearía un administrador con credenciales conocidas.
2. Un **endpoint de escritura (`PUT`) sobre acciones está protegido por un permiso de solo lectura** (`ACTION_READ`), lo que permite alterar el catálogo de permisos con privilegios insuficientes.
3. El **secreto JWT tiene un valor por defecto hardcodeado** utilizable si no se externaliza correctamente.
4. El **perfil Maven por defecto es `local`**, por lo que un build sin `-Pdist` produce un artefacto con configuración de desarrollo (secreto local, cookies inseguras, contextos de Liquibase locales).

A esto se suman ausencia de validación de entrada (excepto en login), ausencia de protección contra fuerza bruta, escalada de privilegios dentro del módulo de administración y exposición de Actuator.

No se afirma que la aplicación sea segura: hay controles correctos, pero los hallazgos anteriores son explotables y prioritarios.

---

## 2. Alcance auditado, tecnologías y limitaciones

**Alcance:** revisión estática completa del repositorio `template` (backend, frontend, infraestructura, configuraciones).

**Backend:** Java 21, Spring Boot 4.1.2 (padre) / propiedad `spring-boot.version` 4.1.1, Maven multi-módulo (`commons`, `cluster`, `domain`, `core`, `ws`, `dashboard`, `webapp`), JJWT 0.12.6, PostgreSQL 42.7.5, Liquibase 4.31.1, Actuator, H2 (runtime).

**Frontend:** Angular 22.2.x (standalone), Bootstrap 5.3.8, `@ngx-translate/core` 18, Service Worker (`ngsw-config.json`), TypeScript 6.0.

**Infraestructura:** Docker Compose (PostgreSQL 18, WildFly, OpenProject), despliegue en WildFly.

**Metodología:** revisión manual de código y configuración, verificación cruzada de cada hallazgo contra la implementación real, y ejecución de `npm audit --package-lock-only` (solo lectura).

**Limitaciones:**

- No se ha ejecutado la aplicación ni se han realizado pruebas dinámicas contra ella.
- No se ha escaneado el árbol de dependencias Maven en busca de CVE (requiere descarga de datos NVD).
- No se dispone del pipeline real de build/despliegue; el efecto en runtime de algunos hallazgos depende de cómo se despliegue.

---

## 3. Hallazgos por severidad

### CRÍTICA

#### SEC-01 — Semillas de desarrollo aplicables en entornos desplegados (administrador con credenciales conocidas)

- **Severidad: Crítica.** Justificación: compromiso total e inmediato del sistema en una instalación nueva.
- **Archivos/líneas:**
  - [db.changelog-master.xml](file:///Users/ijgomez/Documents/workspace/template/template/domain/src/main/resources/db/changelog/db.changelog-master.xml#L48-L55)
  - [20250116-seed-local-admin.xml](file:///Users/ijgomez/Documents/workspace/template/template/domain/src/main/resources/db/changelog/data/v1.0.0/20250116-seed-local-admin.xml#L11-L68)
  - [application-dist.yml](file:///Users/ijgomez/Documents/workspace/template/template/webapp/src/main/resources/application-dist.yml#L9-L54)
  - [application-local.yml](file:///Users/ijgomez/Documents/workspace/template/template/webapp/src/main/resources/application-local.yml#L19-L20)
- **Evidencia:**
  - El changelog maestro incluye los ocho ficheros `seed-local-*` sin condicionar el contexto en el punto de inclusión.
  - Los changesets declaran `context="local"` (p. ej. `20250116-seed-local-admin.xml:11` y `:43`) y **no** declaran `dbms`, a diferencia de los stubs H2 (que usan `dbms="h2"`).
  - El changeset `20250116-seed-local-admin-user` crea el usuario `admin` con perfil `Administrador` que recibe **todas** las acciones (`INSERT INTO profile2action SELECT 1, id FROM action`, líneas 27-30) y un hash BCrypt de la contraseña por defecto documentada en el propio comentario del changeset (línea 50).
  - `application-dist.yml` **no define `spring.liquibase.contexts`**; solo `application-local.yml:20` lo define (`contexts: local`).
- **Escenario de explotación:** un operador despliega el WAR con el perfil `dist` sobre una base de datos PostgreSQL vacía sin definir `spring.liquibase.contexts`. Liquibase, al no recibir contexto en runtime, **ejecuta también los changesets con contexto**, creando el perfil con acceso total y el usuario administrador con credenciales conocidas. Un atacante se autentica como administrador.
- **Condiciones necesarias:** base de datos nueva (los `preConditions` `onFail="MARK_RAN"` evitan re-crear si ya existen) y ausencia de contexto de Liquibase en el entorno desplegado.
- **Recomendación:** añadir `spring.liquibase.contexts: ${LIQUIBASE_CONTEXTS:dist}` (o el valor por defecto seguro que excluya `local`) en `application-dist.yml`; o marcar explícitamente las semillas con `context="local,dev"` y garantizar que el perfil desplegado use un contexto que no las incluya; o mover las semillas a una ruta no incluida por defecto. Adicionalmente, exigir cambio de contraseña / no sembrar usuarios en entornos desplegados.
- **Verificación:** arrancar la aplicación con perfil `dist` contra una BD vacía y comprobar que **no** existe el usuario `admin` ni el perfil `Administrador`: `SELECT count(*) FROM users WHERE username='admin';` debe ser 0. Añadir un test de integración que valide el contexto efectivo.

---

### ALTA

#### SEC-02 — Escritura (`PUT`) sobre acciones autorizada con permiso de solo lectura

- **Severidad: Alta.** Justificación: violación del principio de mínimo privilegio en un recurso de seguridad (catálogo de permisos del sistema).
- **Archivos/líneas:** [SecurityConfig.java](file:///Users/ijgomez/Documents/workspace/template/template/webapp/src/main/java/org/myorganization/template/webapp/security/SecurityConfig.java#L159-L161), [ActionControllerImpl.java](file:///Users/ijgomez/Documents/workspace/template/template/webapp/src/main/java/org/myorganization/template/webapp/controller/ActionControllerImpl.java#L72-L77)
- **Evidencia:** `.requestMatchers(HttpMethod.PUT, ACTIONS_ALL_PATH).hasAuthority(AUTHORITY_ACTION_READ);` donde `AUTHORITY_ACTION_READ = "ACTION_READ"`. `ActionService.update` modifica `name`, `description` y `type` de la acción.
- **Escenario/impacto:** un usuario cuyo perfil solo tiene `ACTION_READ` (pensado para lectura) puede modificar la definición de acciones del sistema vía `PUT /api/v1/administration/security/actions/{id}`, alterando semántica de permisos y habilitando confusión de autorización.
- **Condiciones:** poseer `ACTION_READ`.
- **Recomendación:** proteger `PUT` con una autoridad de escritura específica (p. ej. `ACTION_WRITE`) o `denyAll()` si las acciones deben ser inmutables vía API.
- **Verificación:** test que autentica con un perfil solo-lectura y espera **403** en `PUT /actions/{id}`.

#### SEC-03 — `jwt.secret` con valor por defecto utilizable

- **Severidad: Alta.** Justificación: si el secreto por defecto se usa en un entorno real, cualquier atacante que conozca el valor (está en el repositorio) puede **falsificar tokens** y suplantar a cualquier usuario, incluido administrador.
- **Archivos/líneas:** [application.yml](file:///Users/ijgomez/Documents/workspace/template/template/webapp/src/main/resources/application.yml#L36-L38), [JwtTokenProvider.java](file:///Users/ijgomez/Documents/workspace/template/template/webapp/src/main/java/org/myorganization/template/webapp/security/JwtTokenProvider.java#L40-L45), [JwtAuthenticationFilter.java](file:///Users/ijgomez/Documents/workspace/template/template/webapp/src/main/java/org/myorganization/template/webapp/security/JwtAuthenticationFilter.java#L44-L57)
- **Evidencia:** `jwt.secret: ${JWT_SECRET:default-secret-key-for-development-only-change-in-production-min-32-chars}` (valor por defecto en claro en el repositorio). El proveedor firma con `Keys.hmacShaKeyFor(secret.getBytes())` y el filtro concede las *authorities* del claim `actions` del token.
- **Escenario/impacto:** despliegue con la config base (o `local`) sin `JWT_SECRET`: un atacante firma un JWT con `actions:[...]` arbitrarias y `sub` de un usuario válido → autenticación/autorización completa.
- **Condiciones:** el entorno usa el valor por defecto (perfil sin `JWT_SECRET`).
- **Recomendación:** fallar el arranque si `jwt.secret` no se proporciona explícitamente en perfiles no-locales (validación `@PostConstruct` o `@ConfigurationProperties` con `@NotBlank`); usar gestor de secretos; rotar el secreto.
- **Verificación:** arrancar con perfil `dist` sin `JWT_SECRET` y comprobar que la aplicación **no arranca** (fail-fast). Test unitario que verifique el rechazo de secreto por defecto en contexto no-local.

#### SEC-04 — Perfil Maven `local` activo por defecto

- **Severidad: Alta.** Justificación: produce artefactos desplegables con configuración de desarrollo (agravante de SEC-01 y SEC-03).
- **Archivos/líneas:** [pom.xml](file:///Users/ijgomez/Documents/workspace/template/template/pom.xml#L385-L396)
- **Evidencia:** el perfil `local` tiene `<activeByDefault>true</activeByDefault>` y fija `spring.profiles.active=local` y `angular.configuration=local`. `application.yml:5-6` usa `@spring.profiles.active@`. El perfil `local` implica H2 en memoria, secreto local fijo, cookie `Secure=false`/`SameSite=Lax` y `spring.liquibase.contexts: local`.
- **Escenario/impacto:** un `mvn package` sin `-Pdist` genera un WAR con perfil `local` embebido → cookies sin `Secure`, secreto conocido y semillas aplicadas.
- **Condiciones:** build sin especificar perfil de distribución.
- **Recomendación:** eliminar `activeByDefault` y hacer obligatorio el perfil de despliegue (`-Pdist`), o hacer que el perfil por defecto sea seguro.
- **Verificación:** inspeccionar `application.yml` empaquetado tras `mvn package` sin perfil y comprobar que `spring.profiles.active` no es `local`.
- **Resolución (2026-10-27):** eliminado `<activeByDefault>` del perfil `local` y fijado `<spring.profiles.active>dist</spring.profiles.active>` como propiedad por defecto, por lo que el WAR empaquetado sin perfil declara `dist`. Para no penalizar el arranque en desarrollo, se fijó además `spring-boot.run.profiles` (propiedad del `spring-boot-maven-plugin`, solo afecta al goal `run`): `local` por defecto y `dist`/`test` en sus perfiles. Resultado: `mvn spring-boot:run` sin `-P` arranca en `local`; `mvn package`/`install` sin `-P` produce artefacto `dist`.

---

### MEDIA

#### SEC-05 — Ausencia de validación de entrada y protección frente a *mass assignment*

- **Severidad: Media.**
- **Archivos/líneas:** [UserController.java](file:///Users/ijgomez/Documents/workspace/template/template/webapp/src/main/java/org/myorganization/template/webapp/controller/UserController.java#L93-L97) (`create`), [#L118-L122](file:///Users/ijgomez/Documents/workspace/template/template/webapp/src/main/java/org/myorganization/template/webapp/controller/UserController.java#L118-L122) (`update`), [#L154-L160](file:///Users/ijgomez/Documents/workspace/template/template/webapp/src/main/java/org/myorganization/template/webapp/controller/UserController.java#L154-L160) (`/me`); [ActionControllerImpl.java](file:///Users/ijgomez/Documents/workspace/template/template/webapp/src/main/java/org/myorganization/template/webapp/controller/ActionControllerImpl.java#L72-L77); [UserDTO.java](file:///Users/ijgomez/Documents/workspace/template/template/domain/src/main/java/org/myorganization/template/domain/dto/UserDTO.java), [ProfileDTO.java](file:///Users/ijgomez/Documents/workspace/template/template/domain/src/main/java/org/myorganization/template/domain/dto/ProfileDTO.java)
- **Evidencia:** `create`/`update` reciben `@RequestBody UserDTO` **sin `@Valid`**. Grep de anotaciones de validación en `domain/dto`: **solo `LoginRequest`** tiene `@NotBlank`. Por tanto `@Valid` en `ProfileController`/`ParameterController` no valida nada. `UserService.create` ejecuta `passwordEncoder.encode(dto.password())` sin comprobar nulo → `IllegalArgumentException` → 500.
- **Escenario/impacto:** entradas sin formato de email/username válido; `password` nulo → error 500 (disponibilidad/DoS ligero, ruido); asignación de `profileId` arbitrario (ver SEC-07).
- **Recomendación:** anotar los DTOs (`@NotBlank`, `@Email`, `@Size`, `@NotNull`) y añadir `@Valid` en todos los controladores; validar en el servicio como defensa en profundidad. Manejar `MethodArgumentNotValidException` con respuesta 400 consistente.
- **Verificación:** tests que envíen payloads inválidos (password nulo, email inválido) y esperen 400 (no 500).

#### SEC-06 — Sin limitación de intentos ni bloqueo de cuenta en el login

- **Severidad: Media.**
- **Archivos/líneas:** [AuthController.java](file:///Users/ijgomez/Documents/workspace/template/template/webapp/src/main/java/org/myorganization/template/webapp/controller/AuthController.java#L59-L68), [AuthService.java](file:///Users/ijgomez/Documents/workspace/template/template/core/src/main/java/org/myorganization/template/core/service/AuthService.java#L69-L94)
- **Evidencia:** `authenticate` solo compara credenciales (`passwordEncoder.matches`), sin contador de intentos, retardo, CAPTCHA ni bloqueo. Combinado con SEC-01 (credenciales conocidas) el impacto aumenta.
- **Escenario/impacto:** fuerza bruta/credential stuffing contra `/api/v1/auth/login`.
- **Recomendación:** limitación de tasa por IP/usuario (Bucket4j, filtro propio o WAF), backoff progresivo y bloqueo temporal. Documentar si ya existe control en infraestructura.
- **Verificación:** test de carga que verifique respuestas 429 tras N intentos fallidos.

#### SEC-07 — Escalada de privilegios dentro del módulo de administración (sin segregación de funciones)

- **Severidad: Media.**
- **Archivos/líneas:** [ProfileService.java](file:///Users/ijgomez/Documents/workspace/template/template/core/src/main/java/org/myorganization/template/core/service/ProfileService.java#L101-L123), [UserService.java](file:///Users/ijgomez/Documents/workspace/template/template/core/src/main/java/org/myorganization/template/core/service/UserService.java#L123-L150)
- **Evidencia:** `ProfileService.update` reemplaza las acciones asociadas a un perfil con `dto.actionIds()` (cualquier acción, incluidas las administrativas). `UserService.update` asigna `profileId` arbitrario. No hay distinción entre "quién administra perfiles" y "quién puede conceder permisos".
- **Escenario/impacto:** un usuario con `PROFILE_WRITE` puede conceder cualquier permiso a un perfil (incluido el suyo) → escalada a administrador. Un usuario con `USER_WRITE` puede asignar el perfil administrador a cualquier cuenta.
- **Recomendación:** reservar las operaciones de concesión de permisos/asignación de perfiles a una autoridad superior; validar que no se puedan conceder permisos que el actor no posee; auditar estos cambios.
- **Verificación:** test que intente, con `PROFILE_WRITE`, conceder una acción administrativa y espere denegación.

#### SEC-08 — Falta de control de acceso por usuario en endpoints de informes

- **Severidad: Media.**
- **Archivos/líneas:** [ReportController.java](file:///Users/ijgomez/Documents/workspace/template/template/webapp/src/main/java/org/myorganization/template/webapp/controller/ReportController.java#L66-L70) (`/all`), [#L80-L86](file:///Users/ijgomez/Documents/workspace/template/template/webapp/src/main/java/org/myorganization/template/webapp/controller/ReportController.java#L80-L86) (`/search`), [#L94-L98](file:///Users/ijgomez/Documents/workspace/template/template/webapp/src/main/java/org/myorganization/template/webapp/controller/ReportController.java#L94-L98) (`/{id}/filters`)
- **Evidencia:** `findAll`, `search` y `getFilters` no filtran por el usuario autenticado (a diferencia de `execute`/`export`, que sí llaman `validateUserAccess`). Cualquier usuario con `REPORT_EXECUTE` enumera todos los informes y sus definiciones de filtros.
- **Escenario/impacto:** *information disclosure* / enumeración de recursos no asignados. El impacto actual es bajo porque `getFilters` es un placeholder que devuelve lista vacía, pero `/all` y `/search` sí devuelven el catálogo completo.
- **Recomendación:** restringir `/all` y `/search` a autoridad de administración, o filtrarlos por usuario; añadir control de acceso en `getFilters`.
- **Verificación:** test con usuario sin informes asignados que verifique que no accede a los de otro.

#### SEC-09 — Actuator en el WAR y accesible públicamente

- **Severidad: Media.**
- **Archivos/líneas:** [webapp/pom.xml](file:///Users/ijgomez/Documents/workspace/template/template/webapp/pom.xml#L108-L112), [SecurityConfig.java](file:///Users/ijgomez/Documents/workspace/template/template/webapp/src/main/java/org/myorganization/template/webapp/security/SecurityConfig.java#L191-L197)
- **Evidencia:** `spring-boot-starter-actuator` está en *compile scope* → incluido en el WAR. No existe configuración `management.endpoints.web.exposure.*` en el repositorio. Las rutas `/template/actuator/**` no coinciden con `/api/v1/**`, por lo que caen en `.anyRequest().permitAll()` (línea 197) → **públicas**.
- **Escenario/impacto:** hoy con exposición por defecto solo `health`/`info` (bajo riesgo), pero cualquier endpoint adicional que se exponga en el futuro quedaría **sin autenticación**.
- **Recomendación:** excluir Actuator del WAR de producción o moverlo a un puerto de administración; añadir regla explícita `requestMatchers("/actuator/**").denyAll()`/`hasAuthority(...)` y fijar `management.endpoints.web.exposure.include` de forma explícita.
- **Verificación:** `GET /template/actuator/health` y `/actuator/info` deben devolver 401/403; test de reglas de seguridad.

#### SEC-10 — `Sort`/`Pageable` sin lista blanca y sin manejador genérico de excepciones

- **Severidad: Media.**
- **Archivos/líneas:** [ActionControllerImpl.java](file:///Users/ijgomez/Documents/workspace/template/template/webapp/src/main/java/org/myorganization/template/webapp/controller/ActionControllerImpl.java#L94-L112), [GlobalExceptionHandler.java](file:///Users/ijgomez/Documents/workspace/template/template/webapp/src/main/java/org/myorganization/template/webapp/controller/GlobalExceptionHandler.java)
- **Evidencia:** `buildPageable` construye `Sort.by(direction, property)` con `property` proveniente directamente del parámetro `sort` sin lista blanca. El `GlobalExceptionHandler` **no** define handler para `Exception`/`PropertyReferenceException`.
- **Escenario/impacto:** ordenar por propiedades arbitrarias de la entidad (incluidas no previstas) y provocar `PropertyReferenceException` → 500 no controlado (ruido, posible fuga de internals según configuración de errores).
- **Recomendación:** validar `sort` contra una lista blanca de campos por entidad; añadir handler genérico que devuelva 500 sin detalles internos.
- **Verificación:** test con `sort=campoInexistente` que espere error controlado sin traza.

#### SEC-11 — Credenciales por defecto y puerto de administración expuestos (Docker)

- **Severidad: Media.**
- **Archivos/líneas:** [docker-compose.yml](file:///Users/ijgomez/Documents/workspace/template/template-docker/docker-compose.yml#L9-L38)
- **Evidencia:** `POSTGRES_PASSWORD:-administrador`, `WILDFLY_ADMIN_USER:-admin`, `WILDFLY_ADMIN_PASSWORD:-admin` (líneas 14, 37-38); `WILDFLY_MANAGEMENT_PORT:-9990` publicado (línea 35); imagen WildFly construida sobre `latest-jdk21`.
- **Escenario/impacto:** despliegue con credenciales por defecto → acceso a BD y a la consola de administración de WildFly (9990), típicamente vector de RCE.
- **Condiciones:** despliegue usando los valores por defecto del compose.
- **Recomendación:** eliminar valores por defecto de credenciales (fallar si no se definen); no publicar 9990 externamente; fijar versiones de imagen.
- **Verificación:** `docker compose config` sin `.env` debe fallar o mostrar credenciales vacías.

#### SEC-12 — Secretos versionados y `.gitignore` sin reglas para `.env`

- **Severidad: Media.**
- **Archivos/líneas:** [.env.example](file:///Users/ijgomez/Documents/workspace/template/template-docker/.env.example#L17), [docker-compose.yml](file:///Users/ijgomez/Documents/workspace/template/template-docker/docker-compose.yml#L54), [.gitignore](file:///Users/ijgomez/Documents/workspace/template/.gitignore)
- **Evidencia:** `OPENPROJECT_SECRET_KEY_BASE` aparece con un valor completo en claro en ambos ficheros (valor enmascarado aquí: `44b7…bf54`). El `.gitignore` no contiene reglas para `.env`, `.env.*` ni ficheros de secretos (no hay ningún `.env` versionado, solo `.env.example`).
- **Escenario/impacto:** un secreto de aplicación Rails (OpenProject) versionado → falsificación de sesiones/cookies firmadas de OpenProject. Riesgo de `git add .env` accidental al copiar `.env.example`.
- **Recomendación:** rotar `SECRET_KEY_BASE`; no versionar secretos reales (usar placeholders); añadir `.env`, `.env.*` (con `!.env.example`) al `.gitignore`.
- **Verificación:** `git check-ignore .env` debe ignorarlo; el valor real no debe aparecer en el historial.

---

### BAJA

#### SEC-13 — El interceptor añade `Authorization` a URLs que contengan substrings de auth sin validar origen

- **Severidad: Baja.**
- **Archivos/líneas:** [auth.interceptor.ts](file:///Users/ijgomez/Documents/workspace/template/template/dashboard/src/app/core/interceptors/auth.interceptor.ts#L14-L37)
- **Evidencia:** `AUTH_SKIP_URLS = ['/auth/login', '/auth/refresh', '/auth/logout']` y `isAuthEndpoint` usa `url.includes(path)`; toda petición no coincidente recibe `Authorization: Bearer` sin comprobar que la URL pertenezca al origen de la API.
- **Escenario/impacto:** hoy no explotable (todas las URLs son de la propia API), pero si en el futuro se introduce una URL absoluta a otro origen que contenga `/auth/login`, se enviaría el token a un tercero.
- **Recomendación:** comparar contra `environment.apiUrl` con `startsWith` sobre URL resuelta y validar el origen.
- **Verificación:** test unitario que verifique que una URL externa no recibe el header.

#### SEC-14 — Service Worker con dataGroup `/api/**` no alineado con la ruta real

- **Severidad: Baja.**
- **Archivos/líneas:** [ngsw-config.json](file:///Users/ijgomez/Documents/workspace/template/template/dashboard/ngsw-config.json#L43-L54), [environment.dist.ts](file:///Users/ijgomez/Documents/workspace/template/template/dashboard/src/environments/environment.dist.ts#L6)
- **Evidencia:** el dataGroup `api-freshness` cachea `urls: ["/api/**"]` con estrategia *freshness*, mientras que en `dist` la API es `api/v1` relativa (bajo `/template`). El patrón no coincide con `/template/api/v1/**` → **inerte**.
- **Escenario/impacto:** sin efecto actual; si la app se sirviera en la raíz, las respuestas autenticadas de API se cachearían en el navegador (riesgo de datos obsoletos/sensibles en caché en equipos compartidos).
- **Recomendación:** alinear el patrón con la ruta real o eliminar el dataGroup de API.
- **Verificación:** en DevTools → Application → Cache Storage, comprobar que no se cachean respuestas de API.

#### SEC-15 — CSV formula injection en la exportación

- **Severidad: Baja.**
- **Archivos/líneas:** [ReportService.java](file:///Users/ijgomez/Documents/workspace/template/template/core/src/main/java/org/myorganization/template/core/service/ReportService.java#L205-L229)
- **Evidencia:** `escapeCsv` neutraliza comas, comillas y saltos de línea, pero no prefijos de fórmula (`=`, `+`, `-`, `@`).
- **Escenario/impacto:** si los datos exportados son influenciables por un usuario, al abrir el CSV en Excel/Sheets se pueden ejecutar fórmulas.
- **Recomendación:** prefijar con `'` o entrecomillar valores que comiencen por caracteres de fórmula.
- **Verificación:** test con `name="=cmd|' /C calc'!A0"` que verifique que el CSV exportado lo neutraliza.

#### SEC-16 — Credenciales de E2E hardcodeadas

- **Severidad: Baja.**
- **Archivos/líneas:** [test-data.ts](file:///Users/ijgomez/Documents/workspace/template/template/dashboard/e2e/fixtures/test-data.ts#L9-L14)
- **Evidencia:** `username: 'admin'` con contraseña por defecto del seed local, versionadas en el repositorio.
- **Escenario/impacto:** coherente con el seed local (no es un secreto de producción), pero refuerza SEC-01 al documentar las credenciales por defecto.
- **Recomendación:** parametrizar vía variables de entorno en el pipeline de E2E.
- **Verificación:** ejecutar E2E sin las variables y comprobar que falla de forma explícita.

#### SEC-17 — JWT sin `iss`/`aud` ni algoritmo explícito (defensa en profundidad)

- **Severidad: Baja.**
- **Archivos/líneas:** [JwtTokenProvider.java](file:///Users/ijgomez/Documents/workspace/template/template/webapp/src/main/java/org/myorganization/template/webapp/security/JwtTokenProvider.java#L60-L88)
- **Evidencia:** el token no incluye `issuer`/`audience`; `validateToken` valida firma y expiración con `verifyWith(secretKey)` y `parseSignedClaims`. **Revisado sin hallazgo explotable**: el uso de una `SecretKey` restringe a algoritmos HMAC y rechaza `alg=none` y algoritmos asimétricos, por lo que no hay *algorithm confusion*.
- **Recomendación:** fijar `issuer`/`audience` y restringir el algoritmo explícitamente.
- **Verificación:** test que intente validar un token con `alg` distinto y `iss`/`aud` incorrectos; debe rechazarse.

#### SEC-18 — Sin cabeceras de seguridad (CSP, X-Frame-Options, etc.)

- **Severidad: Baja.**
- **Evidencia:** no se configura Spring Security `headers(...)` ni cabeceras en el servidor para CSP, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`.
- **Recomendación:** añadir CSP (adecuada a Angular), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy` y HSTS si se sirve por HTTPS.
- **Verificación:** comprobar cabeceras con `curl -I` sobre la app desplegada.

#### SEC-19 — `LIKE` sin escapar comodines en filtros

- **Severidad: Baja.**
- **Archivos/líneas:** [UserService.java](file:///Users/ijgomez/Documents/workspace/template/template/core/src/main/java/org/myorganization/template/core/service/UserService.java#L233-L251) (y patrón análogo en `ProfileService`)
- **Evidencia:** `cb.like(cb.lower(root.get("username")), "%" + input.toLowerCase() + "%")` — `%` y `_` del usuario no se escapan. **No hay inyección SQL** (parámetros ligados).
- **Escenario/impacto:** los comodines amplían el resultado (enumeración indirecta), impacto mínimo.
- **Recomendación:** escapar `%`, `_` y `\` en los criterios `LIKE`.
- **Verificación:** test con `username="%"` que verifique que no devuelve todos los registros.

#### SEC-20 — Driver H2 incluido en el WAR de producción

- **Severidad: Baja.**
- **Archivos/líneas:** [webapp/pom.xml](file:///Users/ijgomez/Documents/workspace/template/template/webapp/pom.xml#L126-L130)
- **Evidencia:** dependencia H2 con *scope* `runtime` → incluida en el WAR desplegable.
- **Recomendación:** limitar H2 a *scope* `test`/perfil `local`.
- **Verificación:** inspeccionar `WEB-INF/lib` del WAR y comprobar ausencia de `h2-*.jar`.

#### SEC-21 — Dependencias de desarrollo con vulnerabilidad conocida

- **Severidad: Baja** (0 vulnerabilidades en dependencias de producción).
- **Evidencia (verificado con `npm audit --package-lock-only`):** 2 vulnerabilidades — 1 *high* y 1 *low* — ambas en `vite 8.3.0–8.3.2`, transitiva vía `@angular/build` (advisories `GHSA-698v-4r3x-3vcv`, `GHSA-r825-w8mm-5pxw`, `GHSA-587h-7wmj-h5pm`, `GHSA-9jrq-w75r-8gcw`, `GHSA-rq7h-c2jc-7f22`, `GHSA-vfpm-58rq-9qcg`). `npm audit --omit=dev` → **0 vulnerabilidades**. Los avisos de `launch-editor` afectan a Windows.
- **Escenario/impacto:** afectan al servidor de desarrollo (`ng serve`), no al bundle desplegado.
- **Recomendación:** actualizar `@angular/build` cuando publique la corrección; añadir `npm audit` a CI.
- **Verificación:** `npm audit --omit=dev` debe seguir en 0; los avisos de dev no deben bloquear el build de producción.

---

## 4. Aspectos revisados sin hallazgos

- **XSS / bypass de sanitización (frontend):** grep confirmó **ausencia** de `[innerHTML]`, `bypassSecurityTrust*`, `DomSanitizer`, `eval(` y `new Function`. Angular escapa por defecto en interpolaciones.
- **Gestión de tokens (frontend):** access token **solo en memoria** ([auth.service.ts](file:///Users/ijgomez/Documents/workspace/template/template/dashboard/src/app/core/services/auth.service.ts#L24)); refresh en cookie `HttpOnly`. No hay tokens en `localStorage`/`sessionStorage`.
- **Cookie de refresh (backend):** `HttpOnly`, `Secure`, `SameSite=Strict`, prefijo `__Host-` en `dist`, path acotado a `/template/api/v1/auth` ([AuthController.java](file:///Users/ijgomez/Documents/workspace/template/template/webapp/src/main/java/org/myorganization/template/webapp/controller/AuthController.java#L135-L143)).
- **Rotación y revocación de refresh tokens:** rotación en cada refresh y `revokeAllByUser` ante reuso de token revocado ([AuthService.java](file:///Users/ijgomez/Documents/workspace/template/template/core/src/main/java/org/myorganization/template/core/service/AuthService.java#L110-L139)). `logout` revoca todos los tokens del usuario.
- **Hashing de contraseñas:** BCrypt *strength* 12 ([SecurityConfig.java](file:///Users/ijgomez/Documents/workspace/template/template/webapp/src/main/java/org/myorganization/template/webapp/security/SecurityConfig.java#L222-L225)).
- **Inyección SQL:** todo el acceso a datos usa Spring Data JPA, `Specification` o repositorios con parámetros ligados; no hay concatenación de SQL con entrada de usuario (la exportación construye CSV/TXT con `StringBuilder`, no SQL).
- **Fuga de contraseñas en respuestas:** `UserService.toDTO` devuelve `password = null` siempre ([UserService.java](file:///Users/ijgomez/Documents/workspace/template/template/core/src/main/java/org/myorganization/template/core/service/UserService.java#L261-L284)).
- **Control de acceso por usuario en ejecución/export de informes:** `execute` y `export` validan acceso vía `validateUserAccess` ([ReportService.java](file:///Users/ijgomez/Documents/workspace/template/template/core/src/main/java/org/myorganization/template/core/service/ReportService.java#L123-L181)).
- **`/users/me`:** solo aplica `firstName`, `lastName`, `email`; no permite cambiar perfil ni permisos ([UserService.java](file:///Users/ijgomez/Documents/workspace/template/template/core/src/main/java/org/myorganization/template/core/service/UserService.java#L192-L203)).
- **Mensajes de error:** ni el manejador global ni `SecurityConfig.writeErrorResponse` filtran `ex.getMessage()` de excepciones internas.

## 5. Comprobaciones pendientes

- **SEC-01 / SEC-04:** confirmar en el pipeline real cómo se externaliza la configuración (`template-properties`) y si se invoca `-Pdist` y `LIQUIBASE_CONTEXTS`. La ruta de código está confirmada; el efecto en runtime depende del despliegue.
- **SEC-06:** comprobar si existe limitación de tasa a nivel de infraestructura (WildFly/nginx/WAF); no hay control en la aplicación.
- **SEC-09:** verificar en runtime la exposición efectiva de Actuator (`/template/actuator/*`).
- **Dependencias Maven:** no se ha ejecutado escaneo de CVE (requiere NVD); recomendado OWASP `dependency-check`.
- **CORS en producción:** verificar que `CORS_ALLOWED_ORIGINS` no incluye orígenes comodín ni de desarrollo.

---

## 6. Plan de remediación priorizado

1. **SEC-01 (Crítica):** definir `spring.liquibase.contexts` seguro en `dist` y eliminar/aislar las semillas locales. **Evita el compromiso total inmediato.**
2. **SEC-04 (Alta):** eliminar `activeByDefault=local`; exigir perfil de despliegue. **Evita artefactos con config de desarrollo.**
3. **SEC-03 (Alta):** fail-fast si `jwt.secret` no se externaliza en perfiles no-locales. **Evita falsificación de tokens.**
4. **SEC-02 (Alta):** corregir la autoridad de `PUT /actions`.
5. **SEC-11 / SEC-12 (Media):** eliminar credenciales por defecto de Docker, no publicar 9990, rotar `SECRET_KEY_BASE`, endurecer `.gitignore`.
6. **SEC-05 / SEC-06 (Media):** validación de entrada completa + rate limiting de login.
7. **SEC-07 / SEC-08 (Media):** segregación de funciones en administración y control de acceso en endpoints de informes.
8. **SEC-09 / SEC-10 (Media):** endurecer Actuator y listas blancas de ordenación + handler genérico.
9. **SEC-13…SEC-21 (Baja):** correcciones menores y endurecimientos (CSP, cabeceras, H2 fuera del WAR, CSV injection, alineación del Service Worker, actualizar `@angular/build`).

---

## 7. Pruebas automáticas recomendadas para CI/CD

**Backend (JUnit/Spring Boot Test):**

- `LiquibaseContextIT`: arrancar con perfil `dist` sobre BD vacía y verificar que no se crean usuarios/perfiles seed.
- `AuthorizationEnforcement` ampliado: 403 para perfil solo-lectura en `PUT /actions/{id}`; 401/403 en `/actuator/**`; denegación en `/reports/all|search|{id}/filters` para usuario sin acceso.
- `JwtSecretValidationTest`: arranque falla con secreto por defecto en contexto no-local.
- `InputValidationTest`: 400 (no 500) ante payloads inválidos en `/users` y `/actions`.
- `RateLimitTest`: 429 tras N intentos de login fallidos.
- `SortWhitelistTest`: `sort` inválido devuelve error controlado sin traza.

**Frontend (Vitest/Playwright):**

- `auth.interceptor.spec.ts`: el header `Authorization` no se añade a URLs externas.
- E2E: comprobar que no se cachean respuestas de API autenticadas (Cache Storage).

**Pipeline:**

- `npm audit --omit=dev` (bloqueante) y `npm audit` (informativo).
- OWASP `dependency-check` sobre Maven.
- Escaneo de secretos (gitleaks/trufflehog) que falle si aparece `SECRET_KEY_BASE`/`JWT_SECRET` con valor real.

---

## 8. Tabla resumen

| Estado | Hallazgos |
|---|---|
| **Vulnerabilidades confirmadas** | SEC-01 (Crítica), SEC-02, SEC-03, SEC-04, SEC-05, SEC-07, SEC-08, SEC-10, SEC-11, SEC-12, SEC-13, SEC-14, SEC-15, SEC-16, SEC-19, SEC-20 |
| **Posibles problemas pendientes de verificación** | SEC-06 (¿existe rate limiting en infraestructura?), SEC-09 (exposición real de Actuator en runtime), efecto en runtime de SEC-01/SEC-04 según pipeline, CVE de dependencias Maven (sin escanear), CORS real en producción |
| **Mejoras preventivas** | SEC-17 (iss/aud/algoritmo JWT), SEC-18 (cabeceras de seguridad/CSP), SEC-21 (actualizar `@angular/build`), escaneo de secretos y de dependencias en CI, segregación de funciones |

---

## 9. Seguimiento de aplicación de correcciones

Progreso: **2 / 21 hallazgos aplicados**.

Estados posibles: `Pendiente` · `En curso` · `Aplicado` · `Descartado` (indicar motivo en Notas).

| ID | Hallazgo | Severidad | Estado | Fecha | Notas / referencia |
|---|---|---|---|---|---|
| SEC-01 | Semillas locales aplicables en entornos desplegados | Crítica | Aplicado | 2026-10-27 | Semillas `seed-local-*` fuera del master; nuevo `db.changelog-local.xml` usado solo por perfil `local`; `spring.liquibase.contexts: ${LIQUIBASE_CONTEXTS:dist}` en `application-dist.yml`; test `DistributionSeedingIntegrationTest`. |
| SEC-02 | `PUT` sobre acciones autorizado con `ACTION_READ` | Alta | Pendiente | | |
| SEC-03 | `jwt.secret` con valor por defecto utilizable | Alta | Pendiente | | |
| SEC-04 | Perfil Maven `local` activo por defecto | Alta | Aplicado | 2026-10-27 | Eliminado `<activeByDefault>` del perfil `local`; default seguro `spring.profiles.active=dist` en `<properties>` raíz. Se añadió `spring-boot.run.profiles=local` por defecto (y `dist`/`test` en sus perfiles) para que `mvn spring-boot:run` sin `-P` siga arrancando en local sin exigir variables de distribución, manteniendo el empaquetado seguro. |
| SEC-05 | Sin validación de entrada / *mass assignment* | Media | Pendiente | | |
| SEC-06 | Sin limitación de intentos en el login | Media | Pendiente | | |
| SEC-07 | Escalada de privilegios en el módulo de administración | Media | Pendiente | | |
| SEC-08 | Sin control de acceso por usuario en endpoints de informes | Media | Pendiente | | |
| SEC-09 | Actuator en el WAR y accesible públicamente | Media | Pendiente | | |
| SEC-10 | `Sort`/`Pageable` sin lista blanca y sin handler genérico | Media | Pendiente | | |
| SEC-11 | Credenciales por defecto y puerto 9990 expuestos (Docker) | Media | Pendiente | | |
| SEC-12 | Secretos versionados y `.gitignore` sin reglas para `.env` | Media | Pendiente | | |
| SEC-13 | Interceptor añade `Authorization` sin validar origen | Baja | Pendiente | | |
| SEC-14 | Service Worker con dataGroup `/api/**` no alineado | Baja | Pendiente | | |
| SEC-15 | CSV formula injection en la exportación | Baja | Pendiente | | |
| SEC-16 | Credenciales de E2E hardcodeadas | Baja | Pendiente | | |
| SEC-17 | JWT sin `iss`/`aud` ni algoritmo explícito | Baja | Pendiente | | |
| SEC-18 | Sin cabeceras de seguridad (CSP, X-Frame-Options…) | Baja | Pendiente | | |
| SEC-19 | `LIKE` sin escapar comodines en filtros | Baja | Pendiente | | |
| SEC-20 | Driver H2 incluido en el WAR de producción | Baja | Pendiente | | |
| SEC-21 | Dependencias de desarrollo con vulnerabilidad conocida | Baja | Pendiente | | |

### Comprobaciones y tareas de CI pendientes

| ID | Tarea | Estado | Fecha | Notas / referencia |
|---|---|---|---|---|
| CHK-01 | Confirmar `LIQUIBASE_CONTEXTS` y uso de `-Pdist` en el pipeline | Pendiente | | Afecta a SEC-01/SEC-04 |
| CHK-02 | Verificar rate limiting a nivel de infraestructura (WildFly/nginx/WAF) | Pendiente | | Afecta a SEC-06 |
| CHK-03 | Verificar exposición real de Actuator en runtime | Pendiente | | Afecta a SEC-09 |
| CHK-04 | Escaneo de CVE en dependencias Maven (OWASP dependency-check) | Pendiente | | |
| CHK-05 | Verificar `CORS_ALLOWED_ORIGINS` en producción | Pendiente | | |
| CI-01 | `npm audit --omit=dev` bloqueante + `npm audit` informativo | Pendiente | | |
| CI-02 | OWASP `dependency-check` sobre Maven en CI | Pendiente | | |
| CI-03 | Escaneo de secretos (gitleaks/trufflehog) en CI | Pendiente | | |
| CI-04 | Tests de autorización, validación, rate limit y whitelist de `sort` | Pendiente | | Ver sección 7 |
