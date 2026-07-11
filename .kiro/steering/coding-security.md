# Reglas de Seguridad

## General

- La seguridad se implementa en el módulo `webapp` usando **Spring Security**.
- El principio base es **deny by default**: todo endpoint requiere autenticación salvo los expresamente marcados como públicos.
- No implementar lógica de seguridad en los controladores ni en los servicios; centralizarla en la configuración de Spring Security.

## Autenticación

- Usar **JWT (JSON Web Tokens)** como mecanismo de autenticación stateless.
- Los tokens deben incluir: `sub` (identificador de usuario), `roles`, `iat` (emisión) y `exp` (expiración).
- El tiempo de expiración del access token debe ser corto (p.ej. 15-30 minutos).
- Usar refresh tokens de larga duración para renovar el access token sin re-autenticación.
- Nunca almacenar el JWT en `localStorage`; preferir cookies `HttpOnly` + `Secure` o memoria de la aplicación.

## Autorización

- Usar roles y permisos para controlar el acceso a los recursos.
- Definir roles en una enumeración centralizada (módulo `domain`).
- Proteger endpoints con `@PreAuthorize` usando expresiones de SpEL:

```java
@PreAuthorize("hasRole('ADMIN')")
@DeleteMapping("/{id}")
public ResponseEntity<Void> delete(@PathVariable Long id) { ... }

@PreAuthorize("hasAnyRole('ADMIN', 'USER')")
@GetMapping("/{id}")
public ResponseEntity<UserDto> getById(@PathVariable Long id) { ... }
```

- Habilitar `@EnableMethodSecurity` en la configuración de seguridad.

## Configuración de Spring Security

- Definir la cadena de filtros en una clase `SecurityConfig` anotada con `@Configuration`.
- Estructura mínima recomendada:

```java
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)          // API stateless con JWT
            .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**").permitAll()  // Endpoints públicos
                .requestMatchers("/actuator/health").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }
}
```

## Endpoints Públicos

- Documentar los endpoints públicos con el comentario `// PUBLIC` en el controlador.
- Mantener la lista de rutas públicas centralizada en `SecurityConfig`, no dispersa por la aplicación.
- Los endpoints de autenticación (`/api/v1/auth/login`, `/api/v1/auth/refresh`) siempre son públicos.

## Gestión de Contraseñas

- Usar **BCrypt** para el hash de contraseñas (`BCryptPasswordEncoder` con strength ≥ 12).
- Nunca almacenar ni loguear contraseñas en texto plano.
- Nunca devolver contraseñas (ni hasheadas) en respuestas de la API.

## Protección contra Vulnerabilidades Comunes

### Inyección SQL
- Usar siempre Spring Data JPA o queries con parámetros nombrados. Nunca concatenar SQL.

### XSS
- Sanitizar cualquier entrada de usuario antes de persistirla o devolverla.
- Configurar cabeceras de seguridad HTTP (`Content-Security-Policy`, `X-Content-Type-Options`).

### CSRF
- Deshabilitado para APIs stateless con JWT. Si se usan sesiones, activarlo obligatoriamente.

### CORS
- Configurar CORS explícitamente en Spring Security. No usar `@CrossOrigin` en controladores individuales.
- En producción, limitar `allowedOrigins` a los dominios conocidos del frontend.

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("https://app.myorganization.org"));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE"));
    config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", config);
    return source;
}
```

## Datos Sensibles

- No incluir datos sensibles (contraseñas, tokens, claves) en logs, respuestas de error ni en el código fuente.
- Externalizar secretos (claves JWT, credenciales de BD) en variables de entorno o en `template-properties`. Nunca en `application.yml` versionado.
- Enmascarar campos sensibles en los logs con herramientas como Logback filters o anotaciones `@JsonIgnore`.

## Seguridad en el Frontend (Angular)

- Guardar el token JWT en memoria o en una cookie `HttpOnly`; nunca en `localStorage` ni `sessionStorage`.
- Adjuntar el token en cada petición mediante un **HTTP Interceptor**:

```typescript
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getToken();
    if (token) {
      req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    }
    return next.handle(req);
  }
}
```

- Proteger rutas con **Guards** (`CanActivate`) que comprueben el estado de autenticación.
- No mostrar ni cachear en el cliente datos que el usuario no tenga permiso para ver.

## Auditoría

- Registrar en log los accesos fallidos (autenticación y autorización denegada).
- Usar Spring Data Auditing (`@CreatedBy`, `@LastModifiedBy`) para trazar quién crea o modifica entidades.
