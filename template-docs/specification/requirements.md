# Descripción del Producto

Este documento define los requisitos para la aplicación SPA (Single Page Application) y PWA (Progressive Web App) que sirve como plantilla base para generar nuevos proyectos. La plantilla integra un backend Java/Spring Boot con un frontend Angular, proporcionando las funcionalidades transversales necesarias en toda aplicación empresarial: autenticación, autorización basada en perfiles y acciones, gestión de usuarios, navegación, un layout responsivo y adaptativo, soporte offline e instalabilidad en dispositivos, y una interfaz multiidioma que se adapta automáticamente al Locale del usuario. La aplicación se organiza en tres módulos funcionales principales: Informes (generación, consulta y exportación de datos consolidados), Interfaces (monitor de actividad de integraciones y configuración de interfaces con sistemas externos) y Administración (seguridad con usuarios, perfiles y acciones; parámetros generales; auditoría del sistema; y gestión del cluster). El objetivo es que cualquier nuevo proyecto pueda partir de esta base con las piezas fundamentales ya resueltas.


---

# Requisitos Funcionales — Autenticación y Gestión de Sesión

## Requirement 1: Login y Generación de Tokens

### Descripción
El sistema debe autenticar usuarios mediante credenciales (username/password) y establecer
una sesión segura compuesta por un access token JWT y un refresh token opaco.

### Comportamiento
- El usuario envía credenciales al endpoint POST /api/v1/auth/login.
- El servidor valida las credenciales contra la base de datos (BCrypt).
- Si las credenciales son válidas:
  - Genera un access token JWT (duración corta, configurable).
  - Genera un refresh token opaco (UUID) y lo persiste en la tabla refresh_token.
  - Devuelve el access token en el body de la respuesta JSON.
  - Establece el refresh token como cookie HttpOnly, Secure, SameSite.
- Si las credenciales son inválidas, devuelve 401 Unauthorized.

### Almacenamiento de Tokens
- Access token: almacenado exclusivamente en memoria del frontend Angular (campo privado del servicio).
- Refresh token: almacenado como cookie HttpOnly persistente gestionada por el navegador.
- NUNCA se almacenan tokens en localStorage ni sessionStorage.
- El refresh token NUNCA se incluye en el body de la respuesta JSON.

### Acceptance Criteria
- AC1.1: Login exitoso devuelve accessToken en body y refresh token en Set-Cookie.
- AC1.2: Login fallido devuelve 401 sin establecer cookie.
- AC1.3: El access token no aparece en localStorage ni sessionStorage.
- AC1.4: El refresh token no es accesible desde JavaScript (HttpOnly).
- AC1.5: La cookie tiene los atributos Secure, HttpOnly y SameSite configurados.
- AC1.6: La cookie es persistente (maxAge configurado, no session cookie).

---

## Requirement 2: Persistencia de Sesión y Recuperación Automática

### Descripción
La sesión del usuario debe sobrevivir a:
- Recarga de la página (F5 / Ctrl+R).
- Cierre y reapertura del navegador.
- Reinicio del servidor Spring Boot.
- Reinicio de la aplicación PWA.

### Comportamiento al Arrancar Angular
1. APP_INITIALIZER ejecuta tryRestoreSession().
2. Angular envía POST /api/v1/auth/refresh con withCredentials:true.
3. El navegador adjunta automáticamente la cookie HttpOnly.
4. Si el refresh token es válido:
   - El servidor genera un nuevo access token y un nuevo refresh token (rotación).
   - Responde con el nuevo access token en body y nueva cookie.
   - Angular almacena el access token en memoria.
   - El usuario accede directamente al Dashboard sin ver el login.
5. Si no hay cookie, ha expirado o ha sido revocada:
   - El servidor responde 401.
   - Angular marca sessionRestored=true y permite que el Guard redirija al login.

### Acceptance Criteria
- AC2.1: Recargar la página no obliga a introducir credenciales si el refresh token es válido.
- AC2.2: Cerrar y reabrir el navegador no obliga a login si el refresh token no ha expirado.
- AC2.3: Reiniciar Spring Boot no invalida sesiones existentes (tokens persistidos en BD).
- AC2.4: El proceso de recuperación no provoca redirecciones incorrectas al login.
- AC2.5: El Guard espera a que tryRestoreSession() complete antes de rechazar acceso.

---

## Requirement 3: Renovación Automática del Access Token

### Descripción
El access token debe renovarse automáticamente antes de expirar, sin intervención del usuario,
mientras el refresh token sea válido.

### Comportamiento
1. El interceptor HTTP detecta que el access token está próximo a expirar
   (margen configurable: tokenRefreshMargin).
2. Envía POST /api/v1/auth/refresh (cookie enviada automáticamente).
3. Recibe nuevo access token + cookie rotada.
4. Reemplaza el access token en memoria.
5. Reintenta la petición original con el nuevo token.
6. Si varias peticiones detectan expiración simultáneamente:
   - Solo una petición ejecuta el refresh.
   - Las demás se encolan y esperan el resultado (BehaviorSubject pattern).

### Rotación de Refresh Token
- En cada renovación, el refresh token anterior se revoca en la base de datos.
- Se genera un nuevo refresh token y se establece como nueva cookie.
- Si un refresh token revocado se reutiliza, se revocan TODOS los tokens del usuario
  (detección de posible robo).

### Acceptance Criteria
- AC3.1: El token se renueva proactivamente antes de expirar.
- AC3.2: Las peticiones concurrentes no provocan múltiples llamadas a refresh.
- AC3.3: Cada refresh genera un nuevo refresh token (rotación).
- AC3.4: El refresh token anterior queda invalidado tras la rotación.
- AC3.5: Reutilizar un token revocado invalida todas las sesiones del usuario.
- AC3.6: Si el refresh falla con 401/403, se ejecuta logout y redirect a login.
- AC3.7: Si el refresh falla por error de red/servidor, se muestra notificación sin logout.

---

## Requirement 4: Logout

### Descripción
El logout debe invalidar completamente la sesión del usuario, tanto en el cliente como en el servidor.

### Comportamiento
1. Angular llama POST /api/v1/auth/logout con withCredentials:true.
2. El servidor:
   - Lee el refresh token de la cookie.
   - Revoca TODOS los refresh tokens del usuario en la base de datos.
   - Establece una cookie con maxAge=0 para eliminarla del navegador.
   - Responde 200 OK.
3. Angular:
   - Elimina el access token de memoria.
   - Limpia el estado del usuario autenticado (currentUser = null).
   - Redirige al login.

### Acceptance Criteria
- AC4.1: Tras logout, el access token no está disponible en memoria.
- AC4.2: Tras logout, la cookie del refresh token se elimina del navegador.
- AC4.3: Tras logout, el refresh token está revocado en el servidor.
- AC4.4: Intentar usar el refresh token tras logout devuelve 401.
- AC4.5: Intentar acceder a una ruta protegida tras logout redirige al login.
- AC4.6: El logout no depende únicamente de borrar información del navegador.

---

## Requirement 5: Seguridad del Refresh Token

### Descripción
El refresh token debe cumplir estrictas medidas de seguridad para prevenir
robo, reutilización y exposición.

### Medidas Implementadas
- Token opaco (UUID aleatorio), no JWT — no contiene información decodificable.
- Almacenado en base de datos con asociación a usuario, expiración y estado de revocación.
- Entregado exclusivamente via cookie HttpOnly (no accesible desde JavaScript).
- Cookie con atributo Secure en entornos HTTPS (configurable para desarrollo local HTTP).
- Cookie con SameSite=Strict en producción, Lax en desarrollo local.
- Cookie con Path restringido a /template/api/v1/auth (solo se envía a endpoints de auth).
- Rotación en cada uso (el anterior se invalida).
- Detección de reutilización de tokens revocados (revocación masiva de sesiones).
- Duración configurable por entorno.
- No se registra el valor del token en logs.

### Acceptance Criteria
- AC5.1: El refresh token no está en localStorage ni sessionStorage.
- AC5.2: El refresh token no aparece en el body de ninguna respuesta HTTP.
- AC5.3: La cookie tiene HttpOnly=true.
- AC5.4: La cookie tiene Secure=true en producción.
- AC5.5: La cookie tiene SameSite apropiado.
- AC5.6: La cookie tiene Path restringido a los endpoints de autenticación.
- AC5.7: El token es revocable desde el servidor.
- AC5.8: La expiración se valida en el servidor en cada uso.
- AC5.9: La reutilización de un token revocado dispara revocación masiva.

---

## Requirement 6: Configuración Externalizable

### Descripción
Toda la configuración de autenticación y cookies debe ser externalizable por entorno.

### Parámetros Configurables

| Parámetro                    | Propiedad YAML                   | Default           |
|------------------------------|----------------------------------|--------------------|
| Duración access token        | jwt.access-token-expiration      | 900000 (15 min)    |
| Duración refresh token       | jwt.refresh-token-expiration     | 604800000 (7 días) |
| Secreto JWT                  | jwt.secret                       | (requerido en prod)|
| Nombre de cookie             | auth.cookie.name                 | __Host-refresh-token |
| Path de cookie               | auth.cookie.path                 | /template/api/v1/auth |
| Max-Age de cookie (segundos) | auth.cookie.max-age-seconds      | 604800 (7 días)    |
| Cookie Secure                | auth.cookie.secure               | true               |
| Cookie SameSite              | auth.cookie.same-site            | Strict             |
| CORS origins                 | cors.allowed-origins             | (requerido)        |
| Margen renovación (frontend) | environment.tokenRefreshMargin   | 60000 (1 min)      |

### Acceptance Criteria
- AC6.1: Los parámetros son configurables via variables de entorno.
- AC6.2: El perfil local permite trabajar con HTTP (secure=false, sameSite=Lax).
- AC6.3: El perfil dist/producción fuerza secure=true y sameSite=Strict.

---

## Flujo de Arquitectura

### Login
```
Usuario → POST /auth/login (credentials)
                ↓
     Access Token → body JSON → memoria Angular
                +
     Refresh Token → cookie HttpOnly → navegador
                ↓
     Petición API → Authorization: Bearer {accessToken}
```

### Renovación Automática
```
     Access Token próximo a expirar
                ↓
     POST /auth/refresh (cookie enviada automáticamente)
                ↓
     Nuevo Access Token → memoria Angular
                +
     Nuevo Refresh Token (rotado) → cookie HttpOnly
                ↓
     Reintentar petición original
```

### Arranque de Angular (session recovery)
```
     Angular APP_INITIALIZER
                ↓
     POST /auth/refresh (cookie enviada automáticamente)
                ↓
     Cookie válida → Nuevo Access Token → usuario autenticado → Dashboard
                ↓
     Cookie ausente/expirada/revocada → 401 → mostrar Login
```

### Logout
```
     POST /auth/logout (cookie enviada automáticamente)
                ↓
     Servidor: revoca todos los tokens del usuario
                +
     Servidor: Set-Cookie maxAge=0 (borra cookie)
                ↓
     Angular: limpia accessToken + currentUser
                ↓
     Redirect → /login
```
