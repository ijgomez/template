# Reglas de Seguridad

Directrices de seguridad para la aplicación (backend y frontend).

## General

- La seguridad se implementa en el módulo `webapp` usando **Spring Security**.
- Principio base: **deny by default**.
- No implementar lógica de seguridad en controladores ni servicios; centralizarla en `SecurityConfig`.

## Autenticación

- **JWT** stateless (access token + refresh token).
- Access token: expiración corta (15-30 minutos).
- Refresh token: larga duración.
- Nunca almacenar JWT en `localStorage`; preferir cookies `HttpOnly` + `Secure` o memoria.

## Autorización

- Roles y permisos con `@PreAuthorize` y expresiones SpEL.
- `@EnableMethodSecurity` en la configuración.

## Gestión de Contraseñas

- **BCrypt** con strength >= 12.
- Nunca almacenar ni loguear contraseñas en texto plano.
- Nunca devolver contraseñas en respuestas de API.

## Protección contra Vulnerabilidades

- **Inyección SQL**: Spring Data JPA o queries con parámetros nombrados.
- **XSS**: Sanitizar entradas, cabeceras de seguridad HTTP.
- **CSRF**: Deshabilitado para API stateless con JWT.
- **CORS**: Configurar explícitamente en Spring Security.

## Datos Sensibles

- No incluir datos sensibles en logs, respuestas de error ni código fuente.
- Externalizar secretos en variables de entorno o `template-properties`.

## Seguridad en el Frontend (Angular)

- JWT en memoria o cookie `HttpOnly`.
- HTTP Interceptor para adjuntar token.
- Guards (`CanActivate`) para proteger rutas.

## Autorización de Endpoints Auxiliares para Filtros (`/references`)

- **Principio**: si un usuario tiene acceso a un listado, debe poder usar todos sus filtros sin errores de autorización (403). Los endpoints `/references` que alimentan esos filtros se autorizan con el **permiso de lectura del listado consumidor**, no con el de la entidad referenciada. Ejemplo: `GET /profiles/references` accesible con `USER_READ` porque lo consume la vista de usuarios.
- En `SecurityConfig`, las reglas de los endpoints `/references` deben situarse **antes** de las reglas genéricas de la entidad (por especificidad de URL en Spring Security).
- El diseño del endpoint (DTO, ruta, ordenación) se detalla en [api-rest.md](api-rest.md), sección "Endpoints de Referencia".

## Auditoría

- Registrar accesos fallidos en log.
- Spring Data Auditing (`@CreatedBy`, `@LastModifiedBy`).
