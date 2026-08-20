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

## Permisos de Endpoints Auxiliares para Filtros

- **Principio**: si un usuario tiene acceso a un listado, debe poder utilizar todos los filtros de dicho listado sin obtener errores de autorización (403).
- Los filtros de un listado frecuentemente necesitan cargar datos de referencia de otras entidades (por ejemplo, un dropdown de perfiles en la vista de usuarios). Los endpoints que alimentan esos filtros **deben ser accesibles con el mismo permiso de lectura del listado principal**, no con el permiso de la entidad referenciada.
- **Patrón recomendado**: exponer un endpoint `/references` ligero (id + nombre) en el controlador de la entidad referenciada, con autorización alineada al listado consumidor. Ejemplo: `GET /profiles/references` accesible con `USER_READ` (porque lo consume la vista de usuarios), no solo con `PROFILE_READ`.
- Al añadir un nuevo filtro a un listado existente que requiera datos de otra entidad, verificar siempre que el endpoint que alimenta el filtro sea accesible con los permisos del listado donde se muestra. Si no existe un endpoint adecuado, crear uno de tipo `/references`.
- En `SecurityConfig`, las reglas de los endpoints `/references` deben situarse **antes** de las reglas genéricas de la entidad (por especificidad de URL en Spring Security).

## Auditoría

- Registrar accesos fallidos en log.
- Spring Data Auditing (`@CreatedBy`, `@LastModifiedBy`).
